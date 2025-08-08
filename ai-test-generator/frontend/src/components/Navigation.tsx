import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Add as AddIcon,
  RateReview as ReviewIcon,
  LibraryBooks as LibraryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UI_CONSTANTS } from '../constants';

const menuItems = [
  {
    text: 'Home',
    icon: <HomeIcon />,
    path: '/',
  },
  {
    text: 'Generate Test Cases',
    icon: <AddIcon />,
    path: '/generate',
  },
  {
    text: 'Review & Edit',
    icon: <ReviewIcon />,
    path: '/review',
  },
  {
    text: 'Test Case Library',
    icon: <LibraryIcon />,
    path: '/library',
  },
];

/**
 * Side navigation component with routing
 */
const Navigation: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: UI_CONSTANTS.DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: UI_CONSTANTS.DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: UI_CONSTANTS.APP_BAR_HEIGHT,
          height: `calc(100vh - ${UI_CONSTANTS.APP_BAR_HEIGHT}px)`,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.contrastText,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Navigation;
