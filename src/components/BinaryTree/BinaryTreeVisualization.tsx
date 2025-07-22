import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import BinaryTreeNode from './BinaryTreeNode';
import { getAllUsers } from '../../utils/database';

interface BinaryTreeVisualizationProps {
  rootUser: User;
  maxLevels?: number;
}

const BinaryTreeVisualization: React.FC<BinaryTreeVisualizationProps> = ({ 
  rootUser, 
  maxLevels = 3 
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([rootUser.id]));
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
      console.log('All users:', users);
      console.log('Root user:', rootUser);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // New: Build a one-to-many tree structure
  const buildOneToManyTree = (user: User, level: number): any => {
    if (level > maxLevels) return null;
    const children = allUsers.filter(u => u.sponsor_id === user.id);
    return {
      user,
      children: children.map(child => buildOneToManyTree(child, level + 1)),
      level,
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading binary tree...</div>
        </div>
      </div>
    );
  }

  // Replace old tree with new one-to-many tree
  const tree = allUsers.length > 0 ? buildOneToManyTree(rootUser, 0) : null;

  // New: Render one-to-many tree
  const renderOneToManyTree = (node: any, parentKey = ''): React.ReactNode => {
    if (!node) return null;
    const key = `${parentKey}-${node.user.id}`;
    const isExpanded = expandedNodes.has(node.user.id);
    return (
      <div key={key} className="flex flex-col items-center">
        <div className="relative">
          <BinaryTreeNode
            user={node.user}
            level={node.level}
            onNodeClick={(user) => {
              setSelectedUser(user);
              const newExpanded = new Set(expandedNodes);
              if (isExpanded) {
                newExpanded.delete(user.id);
              } else {
                newExpanded.add(user.id);
              }
              setExpandedNodes(newExpanded);
            }}
          />
          {node.children && node.children.length > 0 && isExpanded && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4">
              <div className="flex space-x-8">
                {node.children.map((child: any) => (
                  <div className="flex flex-col items-center" key={child.user.id}>
                    <div className="w-px h-8 bg-gray-300 mb-2"></div>
                    {renderOneToManyTree(child, key)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Binary Tree Structure</h3>
        <p className="text-sm text-gray-600 mt-1">
          Click on nodes to expand/collapse branches
        </p>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-full flex justify-center">
            {renderOneToManyTree(tree)}
          </div>
        </div>
        
        {selectedUser && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected User Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{selectedUser.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">GPK ID:</span>
                <span className="ml-2 text-gray-900">{selectedUser.gpk_id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Join Date:</span>
                <span className="ml-2 text-gray-900">
                  {selectedUser.join_date ? new Date(selectedUser.join_date).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinaryTreeVisualization;