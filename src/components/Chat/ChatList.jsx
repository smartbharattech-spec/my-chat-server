import React, { useState } from 'react';
import { 
  useTheme,
  useMediaQuery,
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography, 
  Badge, 
  Paper,
  Box,
  InputAdornment,
  TextField
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { 
  Search as SearchIcon 
} from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';

const ChatList = ({ onSelectConversation }) => {
  const { conversations, activeConversation, setActiveConversation, onlineUsers } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (conv) => {
    setActiveConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.other_party_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              '& fieldset': { border: 'none' },
              '&:hover': { bgcolor: '#fff' },
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }
          }}
        />
      </Box>

      {filteredConversations.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {searchQuery ? 'No matching chats found.' : 'No conversations yet.'}
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredConversations.map((conv) => {
          const isActive = activeConversation?.id === conv.id;
          const hasUnread = conv.unread_count > 0;
          
          return (
            <ListItem 
              key={conv.id}
              onClick={() => handleSelect(conv)}
              sx={{ 
                borderRadius: '16px',
                mb: 0.5,
                p: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: isActive ? 'white' : 'transparent',
                boxShadow: isActive ? '0 10px 25px -5px rgba(0,0,0,0.05)' : 'none',
                border: isActive ? '1.5px solid #6366f1' : '1.5px solid transparent',
                '&:hover': {
                  backgroundColor: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px -5px rgba(0,0,0,0.08)'
                }
              }}
            >
              <ListItemAvatar>
                <Badge 
                  color="error" 
                  badgeContent={conv.unread_count} 
                  invisible={!hasUnread}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      right: 2, 
                      top: 2, 
                      border: '2px solid white', 
                      height: 20, 
                      minWidth: 20,
                      fontWeight: 700,
                      fontSize: '0.65rem'
                    } 
                  }}
                >
                  <Badge 
                    overlap="circular" 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot" 
                    color="success"
                    invisible={!(onlineUsers.has(String(conv.user_id)) || onlineUsers.has(String(conv.expert_id)))}
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        backgroundColor: '#22c55e',
                        boxShadow: '0 0 0 2px #fff',
                        height: 10, 
                        width: 10, 
                        borderRadius: '50%' 
                      } 
                    }}
                  >
                    <Avatar 
                      src={conv.profile_image}
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                        border: '2px solid white'
                      }}
                    >
                      {conv.other_party_name?.charAt(0)}
                    </Avatar>
                  </Badge>
                </Badge>
              </ListItemAvatar>
              <ListItemText 
                sx={{ ml: 1 }}
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: hasUnread || isActive ? 700 : 500, 
                        color: isActive ? '#6366f1' : '#1e293b',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      {conv.type === 'broadcast' ? (conv.title || "Community Room") : conv.other_party_name}
                      {conv.type === 'broadcast' && (
                        <Box sx={{ 
                            fontSize: '0.6rem', fontWeight: 900, px: 0.8, py: 0.2, 
                            bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', 
                            border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '4px'
                        }}>
                          COMMUNITY
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: hasUnread ? '#475569' : '#94a3b8',
                      fontWeight: hasUnread ? 500 : 400,
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 1,
                      fontSize: '0.85rem'
                    }}
                  >
                    {conv.last_message || "Start a conversation"}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    )}
    </Box>
  );
};

export default ChatList;
