const express = require('express');
const router = express.Router();
 
router.get('/', (req, res) => {
    res.send('Users');
});

router.get('/new', (req, res) => {
    res.send('New User');
});

//route chaining
router.route('/:id')
    .get((req, res) => {
        res.send(`User ${req.params.id}`);
    })
    .delete((req, res) => {
        res.send(`User ${req.params.id} deleted`);
    })
    .put((req, res) => {
        res.send(`User ${req.params.id} updated`);
    });

router.param('id', (req, res, next,id) => {
    console.log(id);
    next(); 
});
module.exports = router;