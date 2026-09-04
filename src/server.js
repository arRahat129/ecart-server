const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();
const { connectDB } = require('./config/db');
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send("The eCart server is running!!")
})

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
}).catch(err => { console.log('Failed to connect to MongoDB') });