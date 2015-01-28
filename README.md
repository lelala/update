Git軟體發佈程序
====
設定批次執行程式，當網站有更新時，將新的程式push上github後，於瀏覽器開啟網址進行主機端的程式同步更新。

###設定git環境變數
* `git config --global user.email "you@example.com"`
* `git config --global user.name "Your Name"`


###設定各個application的git自動認證
設定在同步資料夾時不會詢問帳號密碼，如果同步的git來源為public，可以略過。

* `cd /www/application` 進入應用程式資料夾
* `git remote show origin` 檢視同步的git網址
* 
```sh
 * remote origin
  Fetch URL: https://github.com/...
  Push  URL: https://github.com/...
  HEAD branch: master
  Remote branch:
    master tracked
  ...
```
* 複製URL，將URL改為`https://username:password@github.com/...`格式(網址最前方加上username:password@後面不變)
* `git remote set-url origin https://...` 設定使用新的URL

###安裝update-git
* `sudo git clone https://github.com/lelala/update-git.git /www/update`使用git取得程式
* `sudo chown ec2-user -R /www/update`設定資料夾存取權限
* `vi /www/update/config.json`修改config
* 
```json
{
    "port": 5678,
    "targets": [
        {
            "name": "application",
            "path": "/www/application",
            "keeplocal": [ "config.json" ],
            "mail": {
                "smtpTransportOptions": {
                    "service": "gmail",
                    "auth": {
                        "user": "account@gmail",
                        "pass": "pwdd"
                    }

                },
                "from": "account@gmail",
                "to": "reciver@mail"
            }
        },
		{
            "name": "application2",
            "path": "/www/application2",
            "keeplocal": [ "config.json" ],
            "mail": {
                "smtpTransportOptions": {
                    "service": "gmail",
                    "auth": {
                        "user": "account@gmail",
                        "pass": "pwdd"
                    }

                },
                "from": "account@gmail",
                "to": "reciver@mail"
            },
            "writeTag": true,
            "requireVersion": true
        }
    ]
}
```
 * 設定PORT：5678
 * 為每一個程式設定一個target物件
   * name: 應用程式名稱，同時為呼叫更新時的path
   * path: 應用程式的實體位址
   * keeplocal: 設定保留不更新的檔案，一般為config檔，讓主機端設定不受更新影響。
   * mail: 指定於更新完成後以email通知的對象
     * smtpTransportOptions: 設定郵件主機， 詳見<https://www.npmjs.com/package/nodemailer>
     * from: 寄件信箱
     * to: 收件人信箱，如有多收信者以`,`分隔
   * writeTag: 發佈後會將發佈時間新增成一個git tag上傳至git，以便未來追蹤
   * requireVersion: 是否必須指定版本號碼，若不需指定版本號碼，可以在版本號欄位輸入HEAD更新至最新版
* `forever start -w --watchDirectory=/www/update/ /www/update/server.js`背景啟動app

###設定開機自動執行
* `sudo vim /etc/rc.d/rc.local`開啟自動執行批次檔
* 新增內容：
```sh
forever start -w --watchDirectory=/www/update/ www/update/server.js
```

###開啟防火牆設定

開啟主機的對外連線PORT：5678，建議指定特定來源IP，免遭攻擊。
應用程式更新時，新版程式push至github後，呼叫<http://主機IP:5678/name>進行主機端更新。
* name為config.json中target的name。
