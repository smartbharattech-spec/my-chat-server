import React, { useState } from 'react';
import { 
  useTheme,
  useMediaQuery,
  List, 
  ListItem,
  Avatar, 
  Typography, 
  Badge, 
  Box,
  InputAdornment,
  TextField
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';

const ChatList = ({ onSelectConversation }) => {
  const { conversations, activeConversation, setActiveConversation, onlineUsers } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (conv) => {
    setActiveConversation(conv);
    if (onSelectConversation) onSelectConversation(conv);
  };

  // Broadcast rooms first, then by last_message_time
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.type === 'broadcast' && b.type !== 'broadcast') return -1;
    if (a.type !== 'broadcast' && b.type === 'broadcast') return 1;
    return new Date(b.last_message_time) - new Date(a.last_message_time);
  });

  const filteredConversations = sortedConversations.filter(conv => {
    const name = conv.type === 'broadcast' ? conv.title : conv.other_party_name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            const isBroadcast = conv.type === 'broadcast';
            const displayName = isBroadcast ? (conv.title || 'Community Room') : conv.other_party_name;

            return (
              <ListItem 
                key={conv.id}
                onClick={() => handleSelect(conv)}
                sx={{ 
                  borderRadius: '16px',
                  mb: 0.5,
                  p: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isBroadcast
                    ? `1.5px solid ${isActive ? '#f59e0b' : 'rgba(245,158,11,0.35)'}`
                    : `1.5px solid ${isActive ? '#6366f1' : 'transparent'}`,
                  background: isBroadcast
                    ? isActive
                      ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                      : 'linear-gradient(135deg, rgba(255,251,235,0.8) 0%, rgba(254,243,199,0.5) 100%)'
                    : isActive ? 'white' : 'transparent',
                  boxShadow: isActive ? '0 8px 20px -5px rgba(0,0,0,0.08)' : 'none',
                  '&:hover': {
                    background: isBroadcast
                      ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                      : 'rgba(255,255,255,0.7)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px -5px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '12px 14px', width: '100%' }}>
                  {/* Avatar */}
                  <Badge 
                    color="error" 
                    badgeContent={conv.unread_count} 
                    invisible={!hasUnread}
                    sx={{ '& .MuiBadge-badge': { right: 2, top: 2, border: '2px solid white', height: 18, minWidth: 18, fontWeight: 700, fontSize: '0.6rem' } }}
                  >
                    {isBroadcast ? (
                      <Box sx={{
                        width: 46, height: 46, borderRadius: '13px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                        fontSize: '1.3rem'
                      }}>
                        📢
                      </Box>
                    ) : (
                      <Badge 
                        overlap="circular" 
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        invisible={!(onlineUsers.has(String(conv.user_id)) || onlineUsers.has(String(conv.expert_id)))}
                        sx={{ '& .MuiBadge-badge': { backgroundColor: '#22c55e', boxShadow: '0 0 0 2px #fff', height: 10, width: 10, borderRadius: '50%' } }}
                      >
                        <Avatar src={conv.profile_image} sx={{ width: 46, height: 46, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                          {conv.other_party_name?.charAt(0)}
                        </Avatar>
                      </Badge>
                    )}
                  </Badge>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: hasUnread || isActive ? 700 : 600, fontSize: '0.88rem', color: isBroadcast ? '#92400e' : (isActive ? '#6366f1' : '#1e293b') }}>
                          {displayName}
                        </Typography>
                        {isBroadcast && (
                          <Box sx={{ fontSize: '0.52rem', fontWeight: 900, px: 0.6, py: 0.1, bgcolor: 'rgba(245,158,11,0.15)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            GROUP
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 600, flexShrink: 0 }}>
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography noWrap sx={{ color: hasUnread ? '#475569' : '#94a3b8', fontWeight: hasUnread ? 500 : 400, fontSize: '0.78rem' }}>
                      {conv.last_message || (isBroadcast ? 'Tap to open community chat' : 'Start a conversation')}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ChatList;
