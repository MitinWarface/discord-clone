'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { canManageRoles } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: number;
  position: number;
}

interface RoleManagerProps {
  serverId: string;
  userId: string;
  onClose: () => void;
}

export default function RoleManager({ serverId, userId, onClose }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#99aab5');

  useEffect(() => {
    checkPermissions();
    loadRoles();
  }, [serverId, userId]);

  const checkPermissions = async () => {
    const hasPermission = await canManageRoles(userId, serverId);
    setCanManage(hasPermission);
  };

  const loadRoles = async () => {
    if (!supabase) {
      toast.error('Supabase не инициализирован');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('server_id', serverId)
        .order('position');

      if (error) {
        console.error('Error loading roles:', error);
        toast.error('Ошибка при загрузке ролей');
      } else {
        setRoles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке ролей');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim() || !supabase) return;

    try {
      const { error } = await supabase
        .from('roles')
        .insert({
          server_id: serverId,
          name: newRoleName.trim(),
          color: newRoleColor,
          permissions: 0, // No permissions by default
          position: roles.length
        });

      if (error) {
        console.error('Error creating role:', error);
        toast.error('Ошибка при создании роли');
      } else {
        toast.success('Роль создана!');
        setNewRoleName('');
        setNewRoleColor('#99aab5');
        setShowCreateRole(false);
        loadRoles();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при создании роли');
    }
  };

  const deleteRole = async (roleId: string, roleName: string) => {
    if (roleName === '@everyone' || roleName === 'Admin') {
      toast.error('Нельзя удалить системные роли');
      return;
    }

    if (!confirm(`Удалить роль "${roleName}"?`) || !supabase) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        console.error('Error deleting role:', error);
        toast.error('Ошибка при удалении роли');
      } else {
        toast.success('Роль удалена!');
        loadRoles();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при удалении роли');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">У вас нет прав на управление ролями</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Управление ролями</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center justify-between p-4 bg-gray-700 rounded">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: role.color }}
              ></div>
              <span className="font-semibold">{role.name}</span>
              <span className="text-sm text-gray-400">
                Позиция: {role.position}
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                Изменить
              </button>
              {role.name !== '@everyone' && role.name !== 'Admin' && (
                <button
                  onClick={() => deleteRole(role.id, role.name)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {!showCreateRole ? (
          <button
            onClick={() => setShowCreateRole(true)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Создать роль
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-700 rounded">
            <div>
              <label className="block text-sm font-medium mb-2">Название роли</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Новая роль"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Цвет</label>
              <input
                type="color"
                value={newRoleColor}
                onChange={(e) => setNewRoleColor(e.target.value)}
                className="w-full h-10 bg-gray-600 rounded cursor-pointer"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createRole}
                disabled={!newRoleName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateRole(false);
                  setNewRoleName('');
                  setNewRoleColor('#99aab5');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}