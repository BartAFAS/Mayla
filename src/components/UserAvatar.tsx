import { getUserAvatar } from '../services/storage';

interface UserAvatarProps {
  userId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-lg',
  lg: 'w-16 h-16 text-4xl',
};

export default function UserAvatar({ userId, name, size = 'md', className = '' }: UserAvatarProps) {
  const emoji = getUserAvatar(userId);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary-50 flex items-center justify-center shrink-0 ${className}`}
    >
      {emoji || name[0]}
    </div>
  );
}
