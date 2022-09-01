const nodemailer = require('nodemailer');

const configuracaoEmailProducao = {
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USUARIO,
        pass: process.env.EMAIL_SENHA
    },
    secure: true

}

const configuracaoEmailTeste = (contaTeste) => ({
    host: 'smtp.ethereal.email', //provedor de emails teste do nodemailer
    auth: contaTeste,
})
async function criaConfiguracaoEmail() {
    if (process.env.NODE_ENV === 'production') { //variavel padrão do node que diz em qual ambiente a gente esta
        //se é ambiente produção o desenvolvedor
        return configuracaoEmailProducao
    } else {
        const contaTeste = await nodemailer.createTestAccount();
        return configuracaoEmailTeste(contaTeste)
    }
}
class Email {
    async enviaEmail() {
        // metodo de email para teste
        const configuracaoEmail = await criaConfiguracaoEmail()
        const transportador = nodemailer.createTransport(configuracaoEmail);
        const info = await transportador.sendMail(this);
        if (process.env.NODE_ENV != 'production') {
            console.log('URL: ' + nodemailer.getTestMessageUrl(info))
        }
    }
}

class EmailVerificacao extends Email {
    constructor(usuario, endereco) {
        super(); //herda todas as definições da classe pai
        this.from = '"Blog do Código"<noreply@blogdocodigo.com.br>';
        this.to = usuario.email;
        this.subject = 'Verificação de e-mail';
        this.text = `Olá! Verifique seu e-mail aqui: ${endereco}`;
        this.html = `<h1>Olá!</h1> Verifique seu e-mail aqui: <a href="${endereco}">${endereco}</a>`;
    }

}
module.exports = { EmailVerificacao }