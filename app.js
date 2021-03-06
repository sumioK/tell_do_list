const express = require('express');
const mysql = require('mysql2');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');

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

//signUp処理

app.get('/signup' , (req , res ) =>{
    res.render('signup.ejs' , {errors:[]});
});

app.post('/signup' , (req , res , next) =>{
    const username = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;

     //入力情報に誤りがあった場合/signupへ戻る
    const errors = [];
    if(username === ''){
        errors.push('ユーザー名が入力されていません');
    }
    if(email === ''){
        errors.push('メールアドレスが入力されていません');
    }
    if(password === ''){
        errors.push('パスワードが入力されていません');
    }
    if(password !== password2){
        errors.push('確認用パスワードが誤っています');
    }
    console.log(errors);

    if(errors.length > 0){
        res.render('signup.ejs' , {errors:errors});
    }else{
        next();
    }
},
(req , res , next) =>{
    const email = req.body.email ;
    const errors = [];
    connection.query(
        'SELECT * FROM users WHERE userMail = ?',
        [email],
        (error , results) => {
            if(results.length > 0){
                errors.push('すでに登録されているメールアドレスです');
                res.render('signup.ejs' , {errors:errors});
            } else {
                next();
            }
    });
},
(req , res) =>{   
    const username = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    
    bcrypt.hash(password , 10 , (error , hash) =>{
    connection.query(
        'INSERT INTO users(userName , userMail , userPassword) VALUES(? ,? , ?)' ,
        [username , email , hash] ,
        (error , results) => {
            req.session.userId = results.insertId ;
            req.session.userName = username ;
            res.redirect('/');
        }
    ); 
  }
);
});

//ログイン画面の表示

app.get('/login' , (req , res) =>{
    res.render('login.ejs' , {errors:[]});
    console.log('ログイン画面が開きました');
});

//ログイン処理

app.post('/login' , (req , res) =>{
    const email = req.body.email ;
    const errors =[];
    connection.query(
        'SELECT * FROM users WHERE userMail=?' ,
        [email] , 
        (error , results) => {
            //条件分岐；一致するuserMailの数を取得し1以上なら次の分岐へ
            if (results.length > 0){
                const plain = req.body.password ;

                const hash = results[0].userPassword ;

                bcrypt.compare( plain , hash , (error , isEqual) =>{
                    if(isEqual){
                        req.session.userId = results[0].userId;
                    req.session.userName = results[0].userName;
                    res.redirect('/');
                    } else {
                        console.log('認証失敗');
                        errors.push('パスワードが誤っています');
                        console.log(errors);
                        res.render('login.ejs' ,{errors:errors});
                    }
                })
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


//pa情報登録画面
app.get('/addpa' , (req ,res) =>{
    connection.query(
        'SELECT * FROM pa' ,
        (error , results) =>{
            res.render('addpa.ejs');
            console.log("addpaが開きました");
            console.log(results);
        });

    });

//Pa情報の登録
app.post('/createPa' , (req , res) =>{
    const sid = req.session.userId ;
    connection.query(
        //情報を追加
        'INSERT INTO pa(paName ,phoneNUm , userId) VALUES( ? ,? , ? )',
        [req.body.addPaName,req.body.addPhoneNum,sid],
        (error ,results) =>{
            res.redirect('/pa');
        }
    );
    });

//Pa一覧画面
    app.get('/pa' , (req ,res) =>{
        connection.query(
            'SELECT * FROM pa WHERE userID =?',
            [req.session.userId] ,
            (error , results) =>{
                res.render('pa.ejs' , {pa:results});
                console.log("paが開きました");
            });
    
    });


//TODOの追加画面
app.get('/addlist' , (req ,res) =>{
    connection.query(
        'SELECT * FROM lists' ,
        (error , results) =>{
            res.render('addlist.ejs' );
            console.log("addlistが開きました");
        });

    });
//TODOの追加処理
app.post('/create' , (req , res) =>{
    const sid = req.session.userId ;
    console.log('createが実行');
    connection.query(           
                'INSERT INTO lists (paName ,listAction ,userId) VALUES(? ,? ,?)',
                [req.body.addListPaName , req.body.addListAction , sid ],
                (error , results) =>{
                    connection.query(
                        'UPDATE lists , pa SET lists.phoneNum = pa.phoneNum WHERE lists.paName = pa.paName AND lists.userId =  pa.userId',
                        (error , results) =>{
                            res.redirect('/list');
                        }
                    );
            });                  
        });

//listの一覧画面
app.get('/list' , (req ,res) =>{
    if(req.session.userId === undefined){
        console.log('ログインしていません');
        connection.query(
            'SELECT * FROM lists' ,
            (error , results) =>{
                res.render('list.ejs' , {lists:[]});
                console.log('ログインしてください')
            });
    } else{
        connection.query(
            'SELECT * FROM lists WHERE userId =?' ,
            [req.session.userId] ,
            (error , results) =>{
                res.render('list.ejs' , {lists:results});
                console.log(results);
            });
    }
});




//paの削除処理
app.post('/deletePa/:id' , (req , res) => {
console.log(req.params.id);
connection.query(
    'DELETE FROM pa WHERE paId=?' ,
    [req.params.id],
    (error , results) => {
        res.redirect('/pa');
    }
);     
});

//listの削除処理
app.post('/deleteList/:id' , (req , res) => {
    console.log(req.params.id);
    connection.query(
        'DELETE FROM lists WHERE listId=?' ,
        [req.params.id],
        (error , results) => {
            res.redirect('/list');
        }
    );     
    });
//ユーザーガイド
app.get('/guide' , (req , res) =>{
    console.log('ユーザーガイドが開きました');
    res.render('guide.ejs');
})
app.listen(3300);