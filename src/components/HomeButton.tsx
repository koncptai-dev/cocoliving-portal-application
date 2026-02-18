import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  color?: string;
  style?: ViewStyle;
}

const HomeButton: React.FC<Props> = ({ color = '#fff', style }) => {
  const navigation = useNavigation<any>();

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'HomeTabs',
            state: { routes: [{ name: 'Dashboard' }] },
          },
        ],
      })
    );
  };

  return (
    <TouchableOpacity onPress={goHome} style={style}>
      <Icon name="home" size={24} color={color} />
    </TouchableOpacity>
  );
};

export default HomeButton;