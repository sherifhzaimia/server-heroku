const puppeteer = require("puppeteer");
const express = require("express");
const axios = require("axios"); // إضافة مكتبة axios
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// تمكين CORS فقط للطلبات القادمة من https://app.inno-acc.com
app.use(cors({
  origin: 'https://app.inno-acc.com'
}));

async function extractSessionToken(res) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ]
    });

    const page = await browser.newPage();

    // الذهاب إلى صفحة تسجيل الدخول لـ CreativeSea
    await page.goto("https://creativsea.com/my-account/", {
      waitUntil: "networkidle2",
      timeout: 120000,
    });

    // إدخال اسم المستخدم
    await page.type("#username", "danielwidmer55477@gmail.com");

    // إدخال كلمة المرور
    await page.type("#password", "rankerfox.com#345");

    // النقر على زر تسجيل الدخول
    await page.click('button[name="login"]');

    // الانتظار حتى يتم التوجيه بعد تسجيل الدخول
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 });

    // استخراج الكوكيز بعد تسجيل الدخول
    const cookies = await page.cookies();

    // البحث عن توكين الجلسة
    const sessionToken = cookies.find(
      (cookie) => cookie.name === "wordpress_logged_in_69f5389998994e48cb1f2b3bcad30e49"
    );

    if (sessionToken) {
      const tokenData = {
        name: sessionToken.name,
        value: sessionToken.value,
        domain: sessionToken.domain,
        path: sessionToken.path,
        expires: sessionToken.expires,
        httpOnly: sessionToken.httpOnly,
        secure: sessionToken.secure,
      };

      // إرسال التوكين إلى API لتخزينه في قاعدة البيانات
      await axios.post("https://app.inno-acc.com/store_session.php", tokenData)
        .then(response => {
          console.log("Response from API:", response.data); // عرض استجابة API في وحدة التحكم
          res.json({ success: true, message: "Session token stored successfully in the database" });
        })
        .catch(error => {
          console.error("Error sending request to API:", error); // عرض الخطأ في حالة فشل الطلب
          res.json({ success: false, message: "Failed to store session token in the database" });
        });

    } else {
      console.log("لم يتم العثور على توكين الجلسة.");
      res.json({ success: false, message: "لم يتم العثور على توكين الجلسة." });
    }

    // إغلاق المتصفح
    await browser.close();
  } catch (error) {
    console.error("حدث خطأ:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء استخراج التوكين." });
  }
}

app.get("/start-session", (req, res) => {
  extractSessionToken(res);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
