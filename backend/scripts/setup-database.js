/**
 * Database Setup Script
 * Automated database setup for CryptoQuantix application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.backendDir = path.join(this.projectRoot, 'backend');
    this.envFile = path.join(this.backendDir, '.env');
    this.envExampleFile = path.join(this.backendDir, '.env.example');
  }

  async setup() {
    console.log('Setting up CryptoQuantix database...');
    
    try {
      // Step 1: Check PostgreSQL installation
      await this.checkPostgreSQL();
      
      // Step 2: Create environment file
      await this.setupEnvironment();
      
      // Step 3: Create database
      await this.createDatabase();
      
      // Step 4: Install dependencies
      await this.installDependencies();
      
      // Step 5: Test database connection
      await this.testDatabase();
      
      console.log('Database setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Start the backend server: npm run dev');
      console.log('2. Start the frontend server: cd ../frontend && npm run dev');
      console.log('3. Test the application at http://localhost:5174');
      
    } catch (error) {
      console.error('Database setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPostgreSQL() {
    console.log('Checking PostgreSQL installation...');
    
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('PostgreSQL is installed');
    } catch (error) {
      console.error('PostgreSQL is not installed or not in PATH');
      console.log('\nPlease install PostgreSQL:');
      console.log('Windows: Download from https://www.postgresql.org/download/windows/');
      console.log('macOS: brew install postgresql');
      console.log('Ubuntu: sudo apt-get install postgresql postgresql-contrib');
      throw new Error('PostgreSQL not found');
    }
  }

  async setupEnvironment() {
    console.log('Setting up environment configuration...');
    
    if (!fs.existsSync(this.envFile)) {
      if (fs.existsSync(this.envExampleFile)) {
        fs.copyFileSync(this.envExampleFile, this.envFile);
        console.log('Created .env file from .env.example');
        console.log('Please update the database credentials in .env file');
      } else {
        console.log('Creating default .env file...');
        const defaultEnv = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoquantix
DB_USER=postgres
DB_PASSWORD=password

# Server Configuration
PORT=3005
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Trading Configuration
COMMISSION_RATE=0.001
VIRTUAL_TRADING_CAPITAL=100000
MAX_POSITIONS_PER_USER=50
PRICE_UPDATE_INTERVAL=1000
SIGNAL_GENERATION_INTERVAL=5000
`;
        fs.writeFileSync(this.envFile, defaultEnv);
        console.log('Created default .env file');
      }
    } else {
      console.log('.env file already exists');
    }
  }

  async createDatabase() {
    console.log('Creating database...');
    
    try {
      // Load environment variables
      require('dotenv').config({ path: this.envFile });
      
      const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
      
      // Create database if it doesn't exist
      const createDbCommand = `createdb -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME}`;
      
      try {
        execSync(createDbCommand, { stdio: 'pipe' });
        console.log(`Database '${DB_NAME}' created successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Database '${DB_NAME}' already exists`);
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Failed to create database:', error.message);
      console.log('\nPlease ensure:');
      console.log('1. PostgreSQL is running');
      console.log('2. Database credentials in .env are correct');
      console.log('3. User has permission to create databases');
      throw error;
    }
  }

  async installDependencies() {
    console.log('Installing backend dependencies...');
    
    try {
      execSync('npm install', { cwd: this.backendDir, stdio: 'pipe' });
      console.log('Dependencies installed successfully');
    } catch (error) {
      console.error('Failed to install dependencies:', error.message);
      throw error;
    }
  }

  async testDatabase() {
    console.log('Testing database connection...');
    
    try {
      const testScript = `
        const { testConnection, initializeDatabase } = require('./database/connection');
        
        async function test() {
          try {
            const connected = await testConnection();
            if (connected) {
              console.log('Database connection successful');
              
              const initialized = await initializeDatabase();
              if (initialized) {
                console.log('Database schema initialized successfully');
                process.exit(0);
              } else {
                console.log('Database schema initialization failed');
                process.exit(1);
              }
            } else {
              console.log('Database connection failed');
              process.exit(1);
            }
          } catch (error) {
            console.error('Database test failed:', error.message);
            process.exit(1);
          }
        }
        
        test();
      `;
      
      const testFile = path.join(this.backendDir, 'test-db.js');
      fs.writeFileSync(testFile, testScript);
      
      execSync('node test-db.js', { cwd: this.backendDir, stdio: 'pipe' });
      
      // Clean up test file
      fs.unlinkSync(testFile);
      
      console.log('Database test passed');
      
    } catch (error) {
      console.error('Database test failed:', error.message);
      throw error;
    }
  }

  async createSampleData() {
    console.log('Creating sample data...');
    
    try {
      const sampleDataScript = `
        const databaseService = require('./services/databaseService');
        
        async function createSampleData() {
          try {
            await databaseService.initialize();
            
            // Generate some initial price data
            await databaseService.updateCryptoPrices();
            
            // Generate some trading signals
            await databaseService.generateTradingSignals();
            
            console.log('Sample data created successfully');
            process.exit(0);
          } catch (error) {
            console.error('Failed to create sample data:', error.message);
            process.exit(1);
          }
        }
        
        createSampleData();
      `;
      
      const sampleFile = path.join(this.backendDir, 'create-sample-data.js');
      fs.writeFileSync(sampleFile, sampleDataScript);
      
      execSync('node create-sample-data.js', { cwd: this.backendDir, stdio: 'pipe' });
      
      // Clean up sample file
      fs.unlinkSync(sampleFile);
      
      console.log('Sample data created successfully');
      
    } catch (error) {
      console.error('Failed to create sample data:', error.message);
      // Don't throw error for sample data creation
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.setup();
}

module.exports = DatabaseSetup;
