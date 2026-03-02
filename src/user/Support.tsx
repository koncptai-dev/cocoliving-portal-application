import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HeaderGradient from '../components/HeaderGradient';
import colors from '../constants/color';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Ya apne according icon library

const SupportScreen = () => {
    
    const navigation = useNavigation();

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <HeaderGradient
        image={require("../../assets/images/support.png")}
        title="Help & Support"
      />

            <View>
                <Text style={styles.tagline}>
                    "Always Here to Ensure Your 
                    <Text style={styles.highlightedText}> Seamless Living</Text>"
                </Text>
                <Text style={styles.span}>- CoCo Living</Text>
            </View>

            <View style={styles.body}>
                {/* Raise New Complaint Button with + icon and right arrow */}
                <TouchableOpacity 
                    style={styles.btn}
                    onPress={() => navigation.navigate('RaiseComplaint')}
                >
                    <View style={styles.btnContent}>
                        <View style={styles.leftSection}>
                            
                            <Text style={styles.btnText}>Raise New Request</Text>
                        </View>
                        <Icon name="add" size={24} color="#fff" style={styles.plusIcon} />
                    </View>
                </TouchableOpacity>

                {/* Complaint Status Button with right arrow */}
                <TouchableOpacity style={styles.btn}
                onPress={() => navigation.navigate('ComplaintStatus')}>
                    <View style={styles.btnContent}>
                        <Text style={styles.btnText}>Request Status</Text>
                        <Icon name="arrow-forward" size={28} color={colors.nOrange} />
                    </View>
                </TouchableOpacity>

                {/* Complaint History Button with right arrow */}
                <TouchableOpacity style={styles.btn}
                onPress={() => navigation.navigate('ComplaintHistory')}>>
                    <View style={styles.btnContent}>
                        <Text style={styles.btnText}>Request History</Text>
                        <Icon name="arrow-forward" size={28} color={colors.nOrange}  />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SupportScreen;

const styles = StyleSheet.create({
    body: {
        padding: 20,
    },
    btn: {
        backgroundColor: '#ede7df',
        padding: 18,
        borderRadius: 30,
        marginBottom: 15,
        height: 70,
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusIcon: {
        marginLeft: 10,
        color:colors.nOrange
    },
    btnText: {
        color: '#444444',
        fontSize: 20,
        fontFamily:'Quicksand-Bold'
    },
    tagline: {
        textAlign: 'center',
        fontSize: 16,
        fontFamily:'Quicksand-Medium',
        marginTop: 10,
        color: '#000000',
    },
    // highlightedText: {
    //     color: colors.primary,
    //     fontWeight: '700',
    // },
    span: {
        textAlign: 'center',
        fontSize: 16,
        fontFamily:'Quicksand-SemiBold',
        color: '#ac9478',
        marginTop: 5,
    }
});