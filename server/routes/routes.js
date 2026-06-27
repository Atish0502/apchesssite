module.exports = app => {

    app.get('/', (req, res) => {
        res.render('index');
    });

    app.get('/game', (req, res) => {
        res.render('game');
    });

    app.get('/ai', (req, res) => {
        res.render('ai');
    });
};