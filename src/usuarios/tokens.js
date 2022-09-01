// é feito pra concentrar os códigos de tokens no mesmo lugar
// novas importações
const crypto = require('crypto');
const moment = require('moment')
const jwt = require('jsonwebtoken');
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token')
const blocklistAccessToken = require('../../redis/blocklist-access-token');
const { InvalidArgumentError } = require('../erros')


function criaTokenJWT(id, [tempoQuantidade, tempoUnidade]) {
    const payload = { id };

    const token = jwt.sign(payload, process.env.CHAVE_JWT, { expiresIn: tempoQuantidade + tempoUnidade });
    return token;
}

async function verificaTokenJWT(token, nome, blocklist) {
    if (!blocklist) {
        return;
    }
    await verificaTokenNaBlocklist(token, nome, blocklist);
    const { id } = jwt.verify(token, process.env.CHAVE_JWT);
    return id;
}

async function verificaTokenNaBlocklist(token, nome, blocklist) {
    const tokenNaBlocklist = await blocklist.contemToken(token);
    if (tokenNaBlocklist) {
        throw new jwt.JsonWebTokenError(`${nome} inválido por logout!`);
    }
}

//aqui foi adicionada a função 
async function criaTokenOpaco(id, [tempoQuantidade, tempoUnidade], allowlist) {
    const payload = { id };
    // temos que usar o moment que é um módulo que serve pra colocar tempo no que queremos
    const tokenOpaco = crypto.randomBytes(24).toString('hex')
    const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix()
        //inserção na allowlist do redis
    await allowlist.adiciona(tokenOpaco, id, dataExpiracao)
        //chama o moment, adiciona o tempo(tempo, unidade de tempo), e transforma para timstemps com o unix 
    return tokenOpaco;
}

async function verificaTokenOpaco(token, nome, allowlist) {
    verificaTokenEnviado(token, nome);
    const id = await allowlist.buscaValor(token)
    verificaTokenValido(id, nome);
    return id;
}

function verificaTokenValido(id, nome) {
    if (!id) {
        throw new InvalidArgumentError(`${nome} é inválido!`);
    }
}

function verificaTokenEnviado(token, nome) {
    if (!token) {
        throw new InvalidArgumentError(`${nome} não enviado!`);
    }
}

function invalidaTokenJWT(token, blocklist) {
    return blocklist.adiciona(token);
}

function invalidaTokenOpaco(token, allowlist) {
    return allowlist.deleta(token)
}

module.exports = {
    access: {
        nome: 'access token',
        lista: blocklistAccessToken,
        expiracao: [15, 'm'],
        cria(id) {
            return criaTokenJWT(id, this.expiracao)
        },
        verifica(token) {
            return verificaTokenJWT(token, this.nome, this.lista)
        },
        invalida(token) {
            return invalidaTokenJWT(token, this.lista)
        }
    },
    refresh: {
        nome: 'refresh token',
        lista: allowlistRefreshToken,
        expiracao: [5, 'd'],
        cria(id) {
            return criaTokenOpaco(id, this.expiracao, this.lista)
        },
        verifica(token) {
            return verificaTokenOpaco(token, this.nome, this.lista)
        },
        invalida(token) {
            return invalidaTokenOpaco(token, this.lista)
        }
    },
    verificacaoEmail: {
        nome: 'token de verificação de e-mail',
        expiracao: [1, 'h'],
        cria(id) {
            return criaTokenJWT(id, this.expiracao)
        },
        verifica(token) {
            return verificaTokenJWT(token, this.nome)
        }
    }
}