import { StyleSheet, Dimensions } from 'react-native';
import { containers, ele, textStyles } from '../../styles'; 

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

// 背景样式
export const bg_style = {
    width: deviceWidth,
    height: deviceHeight,
    resizeMode: 'cover', 
    flex: 1,
}

// 主样式表
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120E26' },
  scrollContent: { paddingBottom: 100 },
  header: { paddingTop: 10, paddingHorizontal: 20, backgroundColor: 'transparent' },
  headerTitle: { color: 'white', fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  tabItem: { paddingBottom: 10, alignItems: 'center', flex: 1 },
  tabText: { color: '#8E8E93', fontSize: 16 },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  activeLine: { height: 2, width: 40, backgroundColor: 'white', marginTop: 5 },

  // Date Strip
  dateStrip: { marginTop: 20, marginBottom: 10, height: 70 },
  dateItem: { ...containers.violetLightC20, ...ele.gnrborder, alignItems: 'center', padding: 10, borderRadius: 20, width: 45 },
  activeDateItem: { backgroundColor: '#5D5FEF' },
  dateTextDay: { color: '#A0A0A0', fontSize: 10, marginBottom: 4 },
  dateTextNum: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  dateHeader: { color: 'white', paddingHorizontal: 20, fontSize: 16, marginBottom: 10, fontWeight: 'bold' },

  // Cards
  card: { ...containers.violetLightC20, ...ele.gnrborder, backgroundColor: 'rgba(48, 31, 68, 0.2)', marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  cardHeaderRow: { flexDirection: 'row', marginBottom: 20 },
  cardTitle: { color: '#D1D1D6', fontSize: 14, marginBottom: 5, fontWeight: 'bold' },
  subText: { color: 'white', fontSize: 12, marginBottom: 10 },
  statLabel: { color: '#A0A0A0', fontSize: 12 },
  statValue: { color: 'white', fontWeight: 'bold', marginTop: 2 },
  rowSpaced: { flexDirection: 'row' },
  
  // Donut
  donutContainer: { marginRight: 15 },
  scoreText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  scoreLabel: { color: '#A0A0A0', fontSize: 8 },
  moonIcon: { width: 70, height: 70, resizeMode: 'contain', position: 'absolute', right: -20, top: -50 },
  
  // Chart Elements
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginTop: 10 },
  barContainer: { width: 12, justifyContent: 'flex-end' },
  barSegment: { width: '100%', borderRadius: 6, marginVertical: 1 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  xAxisText: { color: '#8E8E93', fontSize: 10 },
  
  // Signs Grid
  sectionHeaderOutside: { color: 'white', fontSize: 18, marginLeft: 20, marginBottom: 10, fontWeight: 'bold' },
  signsCard: { ...containers.violetLightC20, ...ele.gnrborder, marginHorizontal: 20, backgroundColor: 'rgba(31, 27, 60, 0.3)', borderRadius: 20, padding: 20, marginBottom: 20 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signItem: { flex: 1 },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#ffffff20' },
  horizontalDivider: { height: 1, backgroundColor: '#ffffff20', marginVertical: 15 },
  signLabel: { color: '#D1D1D6', fontSize: 12 },
  smallLabel: { color: '#8E8E93', fontSize: 10 },
  signValue: { color: 'white', fontSize: 16, fontWeight: '500', marginTop: 5 },

  // Week/Month
  weekItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, height: 65, width: 80, borderRadius: 30, backgroundColor: 'rgba(30, 26, 56, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  monthItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, width: 60, height: 40, borderRadius: 20, backgroundColor: 'rgba(30, 26, 56, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  weekSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 20, alignItems: 'center' },
  bigTime: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  unitText: { fontSize: 20, fontWeight: 'normal' },
  subLabel: { color: '#A0A0A0' },
  moonIconBig: { width: 70, height: 70, resizeMode: 'contain' },
  threeColStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  statBig: { color: 'white', fontSize: 18, fontWeight: '600' },
  statSmall: { color: '#8E8E93', fontSize: 10, marginTop: 2 },
  weekBar: { width: 16, borderRadius: 8 },
  statsRowCard: { ...containers.violetLightC20, ...ele.gnrborder, flexDirection: 'row', backgroundColor: 'rgba(31, 27, 60, 0.3)', marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 20, justifyContent: 'space-between' },
  statCol: { flex:1, alignItems: 'center' },
  statUp: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statNeutral: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statDesc: { color: '#A0A0A0', fontSize: 9, marginTop: 4, textAlign: 'center' },
  
  // Bottom Nav
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, backgroundColor: 'rgba(31, 27, 60, 0.3)', borderTopLeftRadius: 30, borderTopRightRadius: 30, position: 'absolute', bottom: 0, width: '100%' },
  navIcon: { fontSize: 24, color: '#555' }
});

export default styles;