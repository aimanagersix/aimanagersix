
import React, { FC } from 'react';
import { FaChartBar, FaEye, FaSync, FaFileImport, FaBoxes, FaMagic, FaTasks, FaComment, FaPaperPlane, FaKey, FaArrowLeft, FaFilePdf, FaBell, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaCheckCircle, FaTimesCircle, FaLink, FaSave, FaBellSlash, FaEyeSlash, FaCalendarAlt, FaLaptop, FaTicketAlt, FaHistory, FaUsers, FaShieldAlt, FaBoxOpen, FaExclamationTriangle, FaTools, FaWarehouse, FaDesktop, FaPrint, FaUserLock, FaExclamationCircle, FaLock, FaFingerprint, FaClipboardList, FaUserShield, FaQrcode, FaClock, FaDatabase, FaSitemap, FaNetworkWired, FaSearch, FaFilter, FaTimes, FaChartPie, FaSkull, FaUserSecret, FaBug, FaFileContract, FaGlobe, FaServer, FaPaperclip, FaUnlock, FaColumns, FaRobot, FaSpinner, FaCheck, FaMapMarkerAlt, FaCertificate, FaDownload, FaEdit, FaDoorOpen, FaLandmark, FaCopy, FaGraduationCap, FaPlus, FaFileSignature, FaTachometerAlt, FaTruck, FaCalendarPlus, FaUserCircle, FaBook, FaQuestionCircle, FaCog, FaUserTie, FaExternalLinkAlt, FaTrash, FaMapMarkedAlt, FaMousePointer, FaInfoCircle, FaBuilding, FaUnlink, FaChartLine, FaStopwatch, FaEuroSign, FaChevronDown, FaListAlt, FaIdCard, FaUserSlash, FaBroom, FaPlay, FaSeedling, FaSort, FaSortUp, FaSortDown, FaList, FaThLarge, FaToolbox, FaChevronRight, FaShoppingCart, FaShieldVirus, FaAddressBook, FaBars } from 'react-icons/fa';

// Fix: Add FaList and FaThLarge to exports
// Added missing icons for Sidebar and Header: FaToolbox, FaChevronRight, FaShoppingCart, FaShieldVirus, FaAddressBook, FaBars
export { FaChartBar, FaEye, FaSync, FaFileImport, FaBoxes, FaMagic, FaTasks, FaComment, FaPaperPlane, FaKey, FaArrowLeft, FaFilePdf, FaBell, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaCheckCircle, FaTimesCircle, FaLink, FaSave, FaBellSlash, FaEyeSlash, FaCalendarAlt, FaLaptop, FaTicketAlt, FaHistory, FaUsers, FaShieldAlt, FaBoxOpen, FaExclamationTriangle, FaTools, FaWarehouse, FaDesktop, FaPrint, FaUserLock, FaExclamationCircle, FaLock, FaFingerprint, FaClipboardList, FaUserShield, FaQrcode, FaClock, FaDatabase, FaSitemap, FaNetworkWired, FaSearch, FaFilter, FaTimes, FaChartPie, FaSkull, FaUserSecret, FaBug, FaFileContract, FaGlobe, FaServer, FaPaperclip, FaUnlock, FaColumns, FaRobot, FaSpinner, FaCheck, FaMapMarkerAlt, FaCertificate, FaDownload, FaEdit, FaDoorOpen, FaLandmark, FaCopy, FaGraduationCap, FaPlus, FaFileSignature, FaTachometerAlt, FaTruck, FaCalendarPlus, FaUserCircle, FaBook, FaQuestionCircle, FaCog, FaUserTie, FaExternalLinkAlt, FaTrash, FaMapMarkedAlt, FaMousePointer, FaInfoCircle, FaBuilding, FaUnlink, FaChartLine, FaStopwatch, FaEuroSign, FaChevronDown, FaListAlt, FaIdCard, FaUserSlash, FaBroom, FaPlay, FaSeedling, FaSort, FaSortUp, FaSortDown, FaList, FaThLarge, FaToolbox, FaChevronRight, FaShoppingCart, FaShieldVirus, FaAddressBook, FaBars };

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M2 6a2 2 0 012-2h1.586a2 2 0 011.414.586l1.707 1.707A2 2 0 009.414 7H10.5a2 2 0 001.414-.586l1.707-1.707A2 2 0 0115.414 4H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm8 4a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M10 12a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const AssignIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
    </svg>
);

export const UnassignIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m-3-5.25v10.5m0 0l-3-3m3 3l3-3" />
    </svg>
);

export const ReportIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const PrintIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v-2.25a2.25 2.25 0 00-2.25-2.25H6.72m7.5-3l-3.75 3.75M14.25 6l-3.75 3.75m3.75-3.75V1.5m-3.75 3.75L10.5 1.5m3.75 3.75v3.75m-3.75-3.75H3.75a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h16.5a2.25 2.25 0 002.25-2.25v-10.5a2.25 2.25 0 00-2.25-2.25H14.25" />
    </svg>
);

export const MailIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

export const SpinnerIcon: React.FC<{ className?: string }> = ({ className = "animate-spin h-5 w-5 text-white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);
