// Starts the React dev server from the correct working directory
process.chdir(__dirname + '/frontend');
process.env.BROWSER = 'none';
require('./frontend/node_modules/react-scripts/scripts/start.js');
