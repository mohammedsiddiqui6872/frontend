import React, { useState, useEffect } from 'react';
import { Trophy, Star, Lock, Gift, Zap, TrendingUp } from 'lucide-react';
import { MenuItem } from '../../stores/cartStore';

interface FlavorJourneyProps {
  customerName: string;
  orderHistory: any[];
  menuItems: MenuItem[];
  onUnlock: (achievement: Achievement) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: string;
}

export const FlavorJourney: React.FC<FlavorJourneyProps> = ({
  customerName,
  orderHistory,
  menuItems,
  onUnlock
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_order',
      title: 'First Taste',
      description: 'Place your first order',
      icon: <Star className="w-6 h-6" />,
      unlocked: orderHistory.length > 0,
      progress: orderHistory.length > 0 ? 1 : 0,
      maxProgress: 1,
      reward: '10% off next order'
    },
    {
      id: 'category_explorer',
      title: 'Category Explorer',
      description: 'Try items from 5 different categories',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      reward: 'Unlock secret menu'
    },
    {
      id: 'spice_master',
      title: 'Spice Master',
      description: 'Order 10 spicy dishes',
      icon: <Zap className="w-6 h-6" />,
      unlocked: false,
      progress: 7,
      maxProgress: 10,
      reward: 'Free spicy appetizer'
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Share 5 meals with friends',
      icon: <Gift className="w-6 h-6" />,
      unlocked: false,
      progress: 2,
      maxProgress: 5,
      reward: 'Group discount unlocked'
    }
  ]);

  const [tasteProfile, setTasteProfile] = useState({
    spicy: 0.7,
    sweet: 0.3,
    savory: 0.8,
    sour: 0.2,
    umami: 0.6
  });

  const [flavorTree, setFlavorTree] = useState({
    level: 3,
    branches: [
      { flavor: 'Italian', growth: 0.8 },
      { flavor: 'Indian', growth: 0.6 },
      { flavor: 'Mexican', growth: 0.4 },
      { flavor: 'Japanese', growth: 0.3 }
    ]
  });

  // Calculate taste matching with dining companions
  const calculateTasteMatch = (otherProfile: typeof tasteProfile) => {
    const keys = Object.keys(tasteProfile) as Array<keyof typeof tasteProfile>;
    const differences = keys.map(key => 
      Math.abs(tasteProfile[key] - otherProfile[key])
    );
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    return Math.round((1 - avgDifference) * 100);
  };

  // Unlock achievement animation
  const handleAchievementUnlock = (achievement: Achievement) => {
    if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
      const updatedAchievement = { ...achievement, unlocked: true };
      setAchievements(prev => 
        prev.map(a => a.id === achievement.id ? updatedAchievement : a)
      );
      onUnlock(updatedAchievement);
    }
  };

  return (
    <div className="flavor-journey-container">
      {/* Taste Profile Radar Chart */}
      <div className="taste-profile-card glass-panel">
        <h3 className="text-xl font-bold mb-4">Your Taste DNA</h3>
        <div className="radar-chart">
          <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
            {/* Radar chart implementation */}
            <polygon
              points={Object.values(tasteProfile).map((value, index) => {
                const angle = (index / 5) * 2 * Math.PI - Math.PI / 2;
                const x = 100 + value * 80 * Math.cos(angle);
                const y = 100 + value * 80 * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ')}
              fill="rgba(102, 126, 234, 0.3)"
              stroke="rgba(102, 126, 234, 0.8)"
              strokeWidth="2"
            />
            {Object.entries(tasteProfile).map(([flavor, value], index) => {
              const angle = (index / 5) * 2 * Math.PI - Math.PI / 2;
              const x = 100 + 90 * Math.cos(angle);
              const y = 100 + 90 * Math.sin(angle);
              return (
                <text
                  key={flavor}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="text-xs font-medium"
                >
                  {flavor}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Flavor Tree Visualization */}
      <div className="flavor-tree-card glass-panel">
        <h3 className="text-xl font-bold mb-4">Your Flavor Tree</h3>
        <div className="taste-tree">
          <div className="tree-trunk" style={{ height: `${flavorTree.level * 40}px` }} />
          {flavorTree.branches.map((branch, index) => (
            <div
              key={branch.flavor}
              className="tree-branch"
              style={{
                bottom: `${(index + 1) * 60}px`,
                width: `${branch.growth * 100}px`,
                transform: index % 2 === 0 ? 'rotate(-20deg)' : 'rotate(20deg)'
              }}
            >
              <div className="flavor-leaf">
                <span className="text-xs">{branch.flavor}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Level {flavorTree.level} Foodie
        </p>
      </div>

      {/* Achievement Gallery */}
      <div className="achievements-grid">
        <h3 className="text-xl font-bold mb-4 col-span-full">Flavor Achievements</h3>
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-card glass-panel ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            onClick={() => handleAchievementUnlock(achievement)}
          >
            <div className="achievement-icon">
              {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
            </div>
            <h4 className="font-semibold">{achievement.title}</h4>
            <p className="text-xs text-gray-600">{achievement.description}</p>
            
            {/* Progress Bar */}
            <div className="progress-bar mt-2">
              <div className="progress-bg">
                <div 
                  className="progress-fill"
                  style={{
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
              <span className="text-xs">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            
            {achievement.unlocked && (
              <div 
                className="reward-badge"
              >
                <Gift className="w-4 h-4" />
                <span className="text-xs">{achievement.reward}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Social Dining Match */}
      <div className="social-dining-card glass-panel">
        <h3 className="text-xl font-bold mb-4">Taste Compatibility</h3>
        <div className="dining-companions">
          {/* Example companions */}
          <div className="companion-match">
            <div className="avatar">JD</div>
            <div className="match-info">
              <p className="font-medium">John Doe</p>
              <div className="match-percentage">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>87% match</span>
              </div>
            </div>
          </div>
        </div>
        <button className="find-match-btn">
          Find Dining Buddies
        </button>
      </div>

      {/* Secret Menu Unlock */}
      {achievements.find(a => a.id === 'category_explorer')?.unlocked && (
          <div
            className="secret-menu-unlock"
            style={{
              opacity: 1,
              animation: 'slideUp 0.5s ease-out'
            }}
          >
            <Zap className="w-8 h-8 text-yellow-500" />
            <h3 className="text-xl font-bold">Secret Menu Unlocked!</h3>
            <p>You've discovered hidden culinary treasures</p>
          </div>
        )}
    </div>
  );
};