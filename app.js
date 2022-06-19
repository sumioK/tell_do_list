const express = require('express');
const mysql = require('mysql2');
const app = express();
const session = require('express-session');

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

app.use(
    session({
        secret: 'my_secret_key',
        resave: false,
        saveUninitialized: false,
    })
)

app.use((req , res , next) => {
    if(req.session.userId === undefined){
        res.locals.userName = 'ゲスト' ;
        res.locals.isLoggedIn = false;
        
    }else{
        res.locals.userName = req.session.userName;
        res.locals.isLoggedIn = true;
    }
    next();
});

app.get('/' , (req ,res) =>{
connection.query(
    'SELECT * FROM users',
    (error, results) =>{
        console.log('topが開きました');
        console.log(results);
        res.render('top.ejs');
    }
);
});

//ログイン画面の表示

app.get('/login' , (req , res) =>{
    res.render('login.ejs');
    console.log('ログイン画面が開きました');
});

//ログイン処理

app.post('/login' , (req , res) =>{
    const email = req.body.email ;
    connection.query(
        'SELECT * FROM users WHERE userMail=?' ,
        [email] , 
        (error , results) => {
            //条件分岐；一致するuserMailの数を取得し1以上なら次の分岐へ
            if(results.length > 0){
                //条件分岐:パスワードがデータベースと一致するか比較演算
                if(req.body.password === results[0].userPassword){
                    req.session.userId = results[0].userId;
                    req.session.userName = results[0].userName;
                    res.redirect('/');
                } else {
                    console.log('認証失敗');
                    res.redirect('/login');
                }
        } else {
            res.redirect('/login');
        }
    });
});


// ログアウト処理

app.get('/logout' , (req , res ) =>{
    req.session.destroy((error) =>{
        res.redirect('/');
    });
});

app.get('/list' , (req ,res) =>{
    if(req.session.userId === undefined){
        console.log('ログインしていません');
    } else{
        console.log('ログインしています。');
    }
    connection.query(
        'SELECT * FROM todoList' ,
        (error , results) =>{
            res.render('list.ejs');
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