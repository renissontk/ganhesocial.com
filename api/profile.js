import connectDB from "./db.js";
import { User, ActionHistory } from "./User.js";

const handler = async (req, res) => {
  await connectDB();

  if (req.method === "GET") {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userToken = authHeader.split(" ")[1].trim();
    console.log("Token de login recebido:", userToken);

    try {
      // Buscar usuário pelo token de login (UserSchema)
      const usuario = await User.findOne({ token: userToken });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Se o usuário possui histórico de ações, buscamos o mais recente
      let actionHistory;
      if (usuario.historico_acoes && usuario.historico_acoes.length > 0) {
        actionHistory = await ActionHistory.findOne({ _id: { $in: usuario.historico_acoes } }).sort({ data: -1 });
      }

      // Retornar os dados do perfil com o token correto do UserSchema
      res.json({
        nome_usuario: usuario.nome_usuario,  // Nome correto do UserSchema
        email: usuario.email,
        token: usuario.token // ✅ Agora retornando o token do UserSchema
      });
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      res.status(500).json({ error: "Erro ao carregar perfil" });
    }
  } else if (req.method === "PUT") {
    // Atualização do perfil: continua usando o token do User para identificar o usuário
    const { nome_usuario, email } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    const token = authHeader.split(" ")[1].trim();
    console.log("Token recebido para atualização:", token);

    try {
      const usuario = await User.findOneAndUpdate(
        { token },
        { nome_usuario, email },
        { new: true }
      );
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      res.status(500).json({ error: "Erro ao salvar perfil" });
    }
  } else {
    res.status(405).json({ error: "Método não permitido" });
  }
};

export default handler;
