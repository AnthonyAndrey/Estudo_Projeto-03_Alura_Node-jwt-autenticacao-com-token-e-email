const usuariosControlador = require('./usuarios-controlador');
const middlewaresAutenticacao = require('./middlewares-autenticacao');

module.exports = (app) => {
    app
        .route('/usuario/atualiza_token')
        .post(middlewaresAutenticacao.refresh, usuariosControlador.login)

    app
        .route('/usuario/login')
        .post(middlewaresAutenticacao.local, usuariosControlador.login);
    //mudamos o logout, mudamos o metodo para post, para que possamos mandar o refresh token 
    //para ser invalidado
    app
        .route('/usuario/logout')
        .post([middlewaresAutenticacao.refresh, middlewaresAutenticacao.bearer],
            usuariosControlador.logout);

    app
        .route('/usuario')
        .post(usuariosControlador.adiciona)
        .get(usuariosControlador.lista);

    app
        .route('/usuario/verificaEmail/:token')
        .get(middlewaresAutenticacao.verificacaoEmail, usuariosControlador.verificaEmail)

    app
        .route('/usuario/:id')
        .delete(middlewaresAutenticacao.bearer, usuariosControlador.deleta);
};