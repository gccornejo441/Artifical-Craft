import React, { useState, useEffect } from 'react';
import styles from './IPAddress.module.css';

/**
 * Retrieves the IP address of the user and displays it on the UI.
 *
 * @param {callback} callback - A function to handle the retrieved IP address.
 * @return {React.JSX.Element} The IP address display component.
 */
const IPAddressDisplay = () : React.JSX.Element => {
    const [ipAddress, setIpAddress] = useState<string>('');

    useEffect(() => {
        const getIPs = (callback: (ip: string) => void): void => {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel("tegridy-weedy");
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(err => console.error(err));
            pc.onicecandidate = ice => {
                if (ice && ice.candidate && ice.candidate.candidate) {
                    const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate)?.[1];
                    if(myIP) {
                        callback(myIP);
                        pc.close();
                    }
                }
            };
        };
        getIPs(ip => setIpAddress(ip));
    }, []);

    return (
        <h5 className="{styles.textDisplay}">
            Your IP Address: {ipAddress} 👀
        </h5>
    );
};

export default IPAddressDisplay;
