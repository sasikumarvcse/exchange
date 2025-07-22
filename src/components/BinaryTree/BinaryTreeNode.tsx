import { CheckCircle, User, XCircle } from 'lucide-react';
import React from 'react';
import { User as UserType } from '../../types';

interface BinaryTreeNodeProps {
  user: UserType | null;
  level: number;
  onNodeClick?: (user: UserType) => void;
}

const BinaryTreeNode: React.FC<BinaryTreeNodeProps> = ({ user, level, onNodeClick }) => {
  if (!user) {
    return (
      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <span className="text-xs text-gray-400">Empty</span>
      </div>
    );
  }

  return (
    <div 
      className={`w-24 h-24 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md relative ${
        user.is_active
          ? 'border-green-500 bg-green-50 hover:bg-green-100' 
          : 'border-red-500 bg-red-50 hover:bg-red-100'
      }`}
      onClick={() => onNodeClick?.(user)}
    >
      <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center mb-1">
        <User className="h-4 w-4 text-white" />
      </div>
      
      <div className="text-center">
        <p className="text-xs font-medium text-gray-900 truncate w-20">
          {user.name}
        </p>
        <p className="text-xs text-gray-500">{user.gpk_id}</p>
      </div>
      
      <div className="absolute -top-1 -right-1">
        {user.is_active ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default BinaryTreeNode;