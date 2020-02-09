const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true)
mongoose.connect("mongodb+srv://admin-adrian:12345@cluster0-70fmj.mongodb.net/todoDB", { useUnifiedTopology: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

app.get('/', (req, res) => {
    
    Item.find({}, (err, item) => {
            res.render("list", { title: "Today", newTasks: item});
    });
});

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/about', (req, res) => {
    res.render("about");
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName); 

    List.findOne({name: customListName}, (err, foundList) => {
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: []
                });
            
                list.save();
                res.redirect("/" + customListName);
            } else{
                res.render("list", {title: foundList.name, newTasks: foundList.items});
            }
        }
    });

});

app.post('/', (req, res) => {
    const newTask = req.body.task;
    const listName = req.body.list;

    const newItem = new Item({
        name: newTask
    });

    if(listName === "Today"){
        newItem.save();
        res.redirect('/');
    }
    else{
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});


app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, (err) => {});
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }

});

app.listen(process.env.PORT || 3000, () => console.log("Server is running"));
