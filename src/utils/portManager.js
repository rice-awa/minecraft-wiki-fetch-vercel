/**
 * Port management utility
 * Handles port availability checking and automatic port selection
 */

const net = require('net');
const { logger } = require('./logger');

/**
 * Checks if a port is available by attempting to bind to it
 * @param {number} port - Port number to check
 * @param {string} host - Host to bind to (default: '0.0.0.0')
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();
    let resolved = false;
    
    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          server.close();
        } catch (e) {
          // Ignore close errors
        }
        resolve(false);
      }
    }, 1500);
    
    const cleanup = (result) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(result);
      }
    };
    
    server.on('error', (err) => {
      cleanup(false);
    });
    
    server.on('listening', () => {
      // Port is available, close the server
      server.close((err) => {
        cleanup(true);
      });
    });
    
    // Set server options to avoid IPv6 issues
    server.on('close', () => {
      if (!resolved) {
        cleanup(true);
      }
    });
    
    try {
      // Use explicit IPv4 if host is 0.0.0.0
      const listenHost = host === '0.0.0.0' ? '127.0.0.1' : host;
      server.listen(port, listenHost);
    } catch (err) {
      cleanup(false);
    }
  });
}

/**
 * Finds the next available port starting from a given port
 * @param {number} startPort - Starting port number
 * @param {number} maxAttempts - Maximum number of ports to try (default: 100)
 * @param {string} host - Host to bind to (default: '0.0.0.0')
 * @returns {Promise<number|null>} - Available port number or null if none found
 */
async function findAvailablePort(startPort, maxAttempts = 100, host = '0.0.0.0') {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    
    // Skip invalid port numbers
    if (port < 1 || port > 65535) {
      continue;
    }
    
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  
  return null;
}

/**
 * Gets an available port, falling back to alternatives if the preferred port is occupied
 * @param {number} preferredPort - Preferred port number
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum number of ports to try (default: 100)
 * @param {boolean} options.logAttempts - Whether to log port attempts (default: true)
 * @param {string} options.host - Host to bind to (default: '0.0.0.0')
 * @returns {Promise<number>} - Available port number
 * @throws {Error} - If no available port is found
 */
async function getAvailablePort(preferredPort, options = {}) {
  const { maxAttempts = 100, logAttempts = true, host = '0.0.0.0' } = options;
  
  if (logAttempts) {
    logger.info(`Checking port availability`, { preferredPort });
  }
  
  // First, try the preferred port
  if (await isPortAvailable(preferredPort, host)) {
    if (logAttempts) {
      logger.info(`Port ${preferredPort} is available`);
    }
    return preferredPort;
  }
  
  if (logAttempts) {
    logger.warn(`Port ${preferredPort} is already in use, searching for alternative...`);
  }
  
  // Find next available port
  const availablePort = await findAvailablePort(preferredPort + 1, maxAttempts, host);
  
  if (availablePort === null) {
    const error = new Error(`No available port found after checking ${maxAttempts} ports starting from ${preferredPort}`);
    logger.error('Port search failed', { 
      preferredPort, 
      maxAttempts, 
      error: error.message 
    });
    throw error;
  }
  
  if (logAttempts) {
    logger.info(`Found available port ${availablePort}`, { 
      preferredPort, 
      selectedPort: availablePort,
      portsChecked: availablePort - preferredPort
    });
  }
  
  return availablePort;
}

/**
 * Waits for a port to become available
 * @param {number} port - Port number to wait for
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {number} options.interval - Check interval in milliseconds (default: 1000)
 * @returns {Promise<boolean>} - True if port becomes available, false if timeout
 */
async function waitForPort(port, options = {}) {
  const { timeout = 30000, interval = 1000 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await isPortAvailable(port)) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Validates port number
 * @param {number} port - Port number to validate
 * @throws {Error} - If port is invalid
 */
function validatePort(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${port}. Port must be an integer between 1 and 65535.`);
  }
}

/**
 * Safely starts a server with automatic port retry
 * @param {Object} app - Express app instance
 * @param {number} preferredPort - Preferred port number
 * @param {string} host - Host to bind to
 * @param {Object} options - Configuration options
 * @returns {Promise<{server: Object, port: number}>} - Server instance and actual port
 */
async function startServerSafely(app, preferredPort, host = '0.0.0.0', options = {}) {
  const { maxAttempts = 100, logAttempts = true } = options;
  
  let currentPort = preferredPort;
  let lastError = null;
  
  // Try up to maxAttempts different ports
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check if current port is available
      if (!(await isPortAvailable(currentPort, host))) {
        currentPort++;
        continue;
      }
      
      // Try to start the server immediately
      const server = await new Promise((resolve, reject) => {
        const serverInstance = app.listen(currentPort, host, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(serverInstance);
        });
        
        serverInstance.on('error', (error) => {
          reject(error);
        });
        
        // Set a timeout for server startup
        setTimeout(() => {
          reject(new Error(`Server startup timeout on port ${currentPort}`));
        }, 3000);
      });
      
      // Success!
      if (logAttempts && currentPort !== preferredPort) {
        logger.info(`Server started on alternative port ${currentPort}`, {
          preferredPort,
          actualPort: currentPort,
          attemptsUsed: attempt + 1
        });
      }
      
      return { server, port: currentPort };
      
    } catch (error) {
      lastError = error;
      
      if (error.code === 'EADDRINUSE') {
        if (logAttempts && attempt < 3) {
          logger.debug(`Port ${currentPort} in use, trying next port...`, {
            attempt: attempt + 1,
            maxAttempts
          });
        }
        currentPort++;
        continue;
      } else {
        // Non-port related error, don't retry
        throw error;
      }
    }
  }
  
  // If we get here, all attempts failed
  const error = new Error(`Failed to start server after trying ${maxAttempts} ports starting from ${preferredPort}`);
  error.lastError = lastError;
  throw error;
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  getAvailablePort,
  waitForPort,
  validatePort,
  startServerSafely
};