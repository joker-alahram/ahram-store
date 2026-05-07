export function renderLoginPage() {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <h2>تسجيل الدخول</h2>
        <form class="auth-form" data-form="login">
          <label><span>الهاتف أو اسم المستخدم</span><input name="identifier" type="text" autocomplete="username" /></label>
          <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" /></label>
          <button class="btn btn--primary" type="submit">دخول</button>
          <button class="btn btn--ghost" type="button" data-action="go-register">تسجيل عميل جديد</button>
        </form>
      </div>
    </section>
  `;
}

export function renderRegisterPage() {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <h2>تسجيل عميل جديد</h2>
        <form class="auth-form" data-form="register">
          <label><span>الاسم الكامل</span><input name="name" type="text" autocomplete="name" /></label>
          <label><span>الهاتف</span><input name="phone" type="tel" autocomplete="tel" /></label>
          <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="new-password" /></label>
          <label><span>العنوان</span><input name="address" type="text" autocomplete="street-address" /></label>
          <label><span>اسم النشاط</span><input name="businessName" type="text" autocomplete="organization" /></label>
          <label><span>الموقع</span><input name="location" type="text" /></label>
          <button class="btn btn--primary" type="submit">تسجيل</button>
          <button class="btn btn--ghost" type="button" data-action="go-login">رجوع للدخول</button>
        </form>
      </div>
    </section>
  `;
}
