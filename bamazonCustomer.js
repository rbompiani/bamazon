var inquirer = require("inquirer");
var mysql = require("mysql");

// -------- DATABASE CONNECTION CREDENTIALS------------
var connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: "password",
    database: "bamazon"
});

// -------- CONNECT TO DATABASE ------------
// create initial database connection -> relay to select all products

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    selectAll();
});


// -------- QUERY ALL PRODUCTS ------------
// select all products from the database and console log them -> relay to customer input

function selectAll() {
    connection.query("SELECT item_id, product_name, price FROM products", function(err, res) {
        if (err) throw err;
        var products = res;       
        products.forEach(element => {
            console.log("#"+element.item_id+" "+element.product_name+" $"+element.price);
        });
        customerInput();
    });
}


// -------- QUERY PRODUCT BY ID ------------
// select single item from database by customer chosen id
    // *Sufficient quantities -> route to update database quantities
    // *Insufficient Quantities -> route back to customer input

function selectProduct(id, units) {

    // construct query string with variables
    var sql = "SELECT * FROM ?? WHERE ?? = ?";
    var inserts = ['products', 'item_id', id];
    sql = mysql.format(sql, inserts);

    // query the database for specific product
    connection.query(sql, function(err, res) {
        if (err) throw err;

        //store the product as a variable
        var product = res[0]; 

        // check to see if there are enough products on hand to sell
        if (units>product.stock_quantity){
            console.log("I'm sorry, there are not enough units available in our warehouse");
            customerInput();
        } else {
            var newStock = parseInt(product.stock_quantity)-units;
            updateStock(id, newStock);
            var totalCost = product.price*units;
            console.log("Thank you for purchasing "+units+" units of "+product.product_name + " @ $"+product.price+" EA");
            console.log("Your total is $"+totalCost.toFixed(2));
        }
        
    });
}


// -------- PURCHASE ITEMS ------------
// after purchase, update the database to reflect new quantity available -> terminate application

function updateStock(id, newStock){
    // construct query string with variables
    var stock = "UPDATE products SET stock_quantity = ? WHERE ?? = ?";
    var inserts = [newStock, 'item_id', id];
    stock = mysql.format(stock, inserts); 
    
    connection.query(stock, function(err, res){
        if (err) throw err;
        connection.end();
    })
}


// -------- CUSTOMER INPUT ------------
// Ask customers which units to buy, and how many -> route to select identified product

function customerInput(){
    inquirer
    .prompt([
        // Ask customer what to buy
        {
        type: "input",
        message: "Please enter the id # of the product you wish to purchase:",
        name: "id"
        },
        // ask customer how many to buy
        {
        type: "input",
        message: "Number of units to purchase:",
        name: "units"
        }
    ])
    .then(function(inquirerResponse) {
        // select the item from the database
        selectProduct(parseInt(inquirerResponse.id), parseInt(inquirerResponse.units));
    });
}

  