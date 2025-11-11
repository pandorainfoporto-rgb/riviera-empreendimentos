import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, UserCheck, UserX, Shield, Users, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoColors = {
  admin: "bg-red-100 text-red-700 border-red-300",
  colaborador: "bg-blue-100 text-blue-700 border-blue-300",
  cliente: "bg-green-100 text-green-700 border-green-300",
};

const tipoIcons = {
  admin: Shield,
  colaborador: Users,
  cliente: Users,
};

export default function UsuariosList({ usuarios, clientes, isLoading, onEditar, onDelete, onToggleAtivo }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando usuários...</p>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Nenhum usuário encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {usuarios.map((usuario) => {
        const TipoIcon = tipoIcons[usuario.tipo_acesso];
        const cliente = clientes.find(c => c.id === usuario.cliente_id);
        
        return (
          <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    usuario.tipo_acesso === 'admin' ? 'bg-red-100' : 
                    usuario.tipo_acesso === 'colaborador' ? 'bg-blue-100' : 
                    'bg-green-100'
                  }`}>
                    <TipoIcon className={`w-6 h-6 ${
                      usuario.tipo_acesso === 'admin' ? 'text-red-600' : 
                      usuario.tipo_acesso === 'colaborador' ? 'text-blue-600' : 
                      'text-green-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{usuario.nome}</h3>
                      <Badge className={tipoColors[usuario.tipo_acesso]}>
                        {usuario.tipo_acesso === 'admin' ? 'Administrador' : 
                         usuario.tipo_acesso === 'colaborador' ? 'Colaborador' : 
                         'Cliente'}
                      </Badge>
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📧 {usuario.email}</p>
                      {usuario.telefone && <p>📱 {usuario.telefone}</p>}
                      {usuario.cargo && <p>💼 {usuario.cargo}</p>}
                      {cliente && <p>👤 Cliente: {cliente.nome}</p>}
                      {usuario.ultimo_acesso && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Último acesso: {format(parseISO(usuario.ultimo_acesso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      {usuario.primeiro_acesso && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Primeiro acesso pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleAtivo(usuario)}
                    title={usuario.ativo ? "Desativar" : "Ativar"}
                  >
                    {usuario.ativo ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditar(usuario)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(usuario)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {usuario.observacoes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{usuario.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}