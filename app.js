const express = require('express');
const mysql = require('mysql2');
const app = express();


app.use(express.static('public'));

app.use(express.urlencoded({extended: false}));


const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password: 'reborn2744696',
    database:'tell_do_list'
});

connection.connect((err) =>{
    if(err){
        console.log('error connecting:'+ err.stack);
        return;
    }
    console.log('success');
});


app.get('/' , (req ,res) =>{
connection.query(
    'SELECT * FROM todoList',
    (error, results) =>{
        console.log('topが開きました');
        console.log(results);
        res.render('top.ejs');
    }
);
});

app.get('/list' , (req ,res) =>{
    connection.query(
        'SELECT * FROM todoList' ,
        (error , results) =>{
            res.render('list.ejs' , {todoList:results});
            console.log("listが開きました");
        });

});

app.get('/user' , (req ,res) =>{
    connection.query(
        'SELECT * FROM userInfo' ,
        (error , results) =>{
            res.render('user.ejs' , {userInfo:results});
            console.log("userが開きました");
        });

});

app.get('/new' , (req ,res) =>{
    connection.query(
        'SELECT * FROM todoList' ,
        (error , results) =>{
            res.render('new.ejs' );
            console.log("newが開きました");
        });

    });

app.post('/create' , (req , res) =>{
    connection.query(
                'INSERT INTO todoList(name ,todo ) VALUES(? ,?)',
                    [req.body.addListUserName,req.body.addListAction],
                (error , results) =>{
                    connection.query(
                        'UPDATE todoList , userInfo SET todoList.phone = userInfo.phone WHERE todoList.name = userInfo.name',
                        (error , results) =>{
                            res.redirect('/list');
                        }
                    );
            });                  
        });

//電話番号登録

app.get('/tell' , (req ,res) =>{
    connection.query(
        'SELECT * FROM userInfo' ,
        (error , results) =>{
            res.render('tell.ejs');
            console.log("tellが開きました");
            console.log(results);
        });

    });


app.post('/createUser' , (req , res) =>{

    console.log(req.body.addInfoUserName);
    console.log(req.body.addInfoUserPhone);
    connection.query(
        //情報を追加
        'INSERT INTO userInfo(name ,phone) VALUES(? ,?)',
        [req.body.addInfoUserName,req.body.addInfoUserPhone],
        (error ,results) =>{
            res.redirect('/user')
        }
    );
    });



    //リストの削除処理
app.post('/deleteList/:id' , (req , res) => {
console.log(req.params.id);
connection.query(
    'DELETE FROM todoList WHERE id=?' ,
    [req.params.id],
    (error , results) => {
        res.redirect('/list');
    }
);     
});


//登録情報の削除処理
app.post('/deleteUser/:id' , (req , res) => {
console.log(req.params.id);
connection.query(
    'DELETE FROM userInfo WHERE id=?' ,
    [req.params.id],
    (error , results) => {
        res.redirect('/user');
    }
);     
});

app.listen(3300);