var router = require('express').Router();
var Product = require('../models/product');

function paginate(req,res,next){
    var perPage = 9;
    var page = req.params.page;
    Product
        .find()
        .skip( perPage * page )
        .limit( perPage )
        .populate( 'category' )
        .exec(function(err, products) {
            if(err) next(err);
            Product.count().exec(function(err, count){
                if(err) next(err);
                res.render('main/product-main', {
                    products: products,
                    pages: count/perPage
                });
            })
        })
}

router.get('/', function(req,res,next){
    if(req.user){
        paginate(req,res,next);
    }else{
        res.render('main/home');
    }
});

router.get('/page/:page', function(req,res,next){
    paginate(req,res,next);
})

Product.createMapping(function(err,mapping){
   if(err){
       console.log('error creating mapping');
       console.log(err);
   }else{
       console.log('Mapping created');
       console.log(mapping);
   }
});

var stream = Product.synchronize();
var count = 0;

stream.on('data', function(){
   count++;
});

stream.on('error',function (){
   console.log(err);
});

stream.on('close', function (err){
   console.log('Indexed ' + count + ' documents');
});

router.get('/products/:id', function(req,res,next){
    Product
        .find({ category : req.params.id })
        .populate('category')
        .exec(function(err, products){
            console.log('------------------------------------------');
            console.log(' Category looking for : ' + req.params.id);
            console.log('inside exec: ' + products.length);
            if(err) return next(err);
            res.render('main/category',{
                products: products
            });
            /*res.jsonp(products);*/
        });
});

router.get('/product/:id', function(req,res,next){
    Product.findById({ _id: req.params.id }, function(err, product){
        if(err) return next(err);
        res.render('main/product', {
            product: product
        });
    });
});

router.post('/search', function(req,res,next){
   res.redirect('/search?q=' + req.body.q);
});

router.get('/search', function(req,res,next){
   if(req.query.q){
       Product.search({
           query_string: { query: req.query.q }
       },function(err, results){
           if(err) next(err);
           console.log(results);
           var data = results.hits.hits.map(function(hit){
               return hit;
           });

           res.render('main/search-result', {
              query: req.query.q,
               data: data
           });

       });
   } 
});

module.exports = router;