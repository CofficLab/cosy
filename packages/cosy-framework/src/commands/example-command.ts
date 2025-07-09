import { Command } from 'commander';

/**
 * 配置自定义命令示例
 *
 * 这个文件展示了如何创建自定义命令并集成到 Cosy Framework CLI 中。
 * 你可以参考这个模板来创建自己的命令。
 *
 * @param program Commander 程序实例
 */
export function configureCustomCommand(program: Command): void {
  program
    .command('hello')
    .description('A custom command example that greets the user')
    .argument('<name>', 'name to greet')
    .option('-l, --language <lang>', 'greeting language', 'en')
    .option('--uppercase', 'make greeting uppercase')
    .addHelpText(
      'after',
      `
💡 示例:
   cosy hello Alice           用英语问候 Alice
   cosy hello Bob --language zh   用中文问候 Bob
   cosy hello Charlie --uppercase --language es  用大写西班牙语问候 Charlie

📝 支持的语言:
   en - English (默认)
   zh - 中文
   es - Español
   fr - Français
   de - Deutsch

🎯 这是一个示例命令，展示了如何：
   • 定义命令参数和选项
   • 添加帮助文本
   • 实现参数验证
   • 处理不同的输出格式
`
    )
    .action(
      async (
        name: string,
        options: {
          language: string;
          uppercase?: boolean;
        }
      ) => {
        // 验证参数
        if (!name || name.trim() === '') {
          console.error('❌ 错误: 姓名不能为空');
          console.error('💡 示例: cosy hello Alice');
          process.exit(1);
        }

        // 定义问候语
        const greetings: Record<string, string> = {
          en: `Hello, ${name}! Welcome to Cosy Framework! 👋`,
          zh: `你好，${name}！欢迎使用 Cosy Framework！ 👋`,
          es: `¡Hola, ${name}! ¡Bienvenido a Cosy Framework! 👋`,
          fr: `Bonjour, ${name}! Bienvenue dans Cosy Framework! 👋`,
          de: `Hallo, ${name}! Willkommen bei Cosy Framework! 👋`,
        };

        // 获取问候语
        let greeting = greetings[options.language];
        if (!greeting) {
          console.error(`❌ 错误: 不支持的语言 "${options.language}"`);
          console.error('💡 支持的语言: en, zh, es, fr, de');
          process.exit(1);
        }

        // 应用大写选项
        if (options.uppercase) {
          greeting = greeting.toUpperCase();
        }

        // 显示问候
        console.log('\n🎉 自定义命令执行成功!\n');
        console.log(greeting);
        console.log('');

        // 显示额外信息
        console.log('📊 命令详情:');
        console.log(`   姓名:     ${name}`);
        console.log(`   语言:     ${options.language}`);
        console.log(`   大写:     ${options.uppercase ? '是' : '否'}`);
        console.log('');

        console.log('💡 提示: 这只是一个示例命令，展示了如何创建自定义CLI功能');
      }
    );
}
