/**
 * 21天好习惯 - 前台功能测试
 *
 * 运行方式:
 * 1. 确保后端和前端服务已启动
 * 2. npx playwright test
 */

const { test, expect } = require('@playwright/test');

test.describe('前台功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('登录页面加载', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('21天好习惯');
    await expect(page.locator('h2')).toContainText('登录');
  });

  test('注册页面跳转', async ({ page }) => {
    await page.click('text=注册');
    await expect(page.locator('h2')).toContainText('注册');
  });

  test('用户注册流程', async ({ page }) => {
    await page.click('text=注册');

    // 填写注册表单
    await page.fill('input[type="text"]', 'playwrightuser');
    await page.fill('input[type="email"]', 'playwright@test.com');
    await page.fill('input[type="password"] >> nth=0', 'test123456');
    await page.fill('input[type="password"] >> nth=1', 'test123456');

    // 提交注册
    await page.click('button:has-text("注册")');

    // 等待跳转到首页
    await page.waitForURL('http://localhost:5173/');
  });

  test('登录功能', async ({ page }) => {
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button:has-text("登录")');

    // 等待跳转到首页
    await page.waitForURL('http://localhost:5173/');
  });

  test('顶部菜单显示用户名', async ({ page }) => {
    // 先登录
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button:has-text("登录")');

    await page.waitForURL('http://localhost:5173/');

    // 检查是否显示用户名
    await expect(page.locator('nav button')).toBeVisible();
  });

  test('习惯列表页面', async ({ page }) => {
    // 先登录
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button:has-text("登录")');

    await page.waitForURL('http://localhost:5173/');

    // 检查习惯列表
    await expect(page.locator('h2:has-text("我的习惯")')).toBeVisible();
  });

  test('添加习惯功能', async ({ page }) => {
    // 先登录
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button:has-text("登录")');

    await page.waitForURL('http://localhost:5173/');

    // 点击添加习惯
    await page.click('button:has-text("添加习惯")');

    // 填写习惯名称
    await page.fill('input[type="text"]', '测试习惯');
    await page.fill('textarea', '这是一个测试习惯');

    // 提交
    await page.click('button:has-text("创建")');
  });
});

test.describe('管理后台功能测试', () => {
  test('管理员访问后台', async ({ page }) => {
    // 使用管理员账号登录
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'administrator');
    await page.fill('input[type="password"]', 'admin123456');
    await page.click('button:has-text("登录")');

    await page.waitForURL('http://localhost:5173/');

    // 点击顶部菜单
    await page.click('nav button');

    // 检查是否有管理后台选项
    await expect(page.locator('text=管理后台')).toBeVisible();
  });

  test('普通用户无法访问管理后台', async ({ page }) => {
    // 使用普通用户登录
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'test123456');
    await page.click('button:has-text("登录")');

    await page.waitForURL('http://localhost:5173/');

    // 尝试直接访问管理后台
    await page.goto('http://localhost:5173/admin');

    // 应该被重定向到首页
    await expect(page.url()).toBe('http://localhost:5173/');
  });
});
