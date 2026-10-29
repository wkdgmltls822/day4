// 지도에 올리는 장소들. 위치는 지도 표시용 "대략적인" 좌표예요.
export const LAYERS = [
  { id: 'tour', label: '관광지', icon: '📍', color: '#ff6b9d' },
  { id: 'oreum', label: '오름·산', icon: '⛰️', color: '#7fbf5a' },
  { id: 'olle', label: '올레길(개략)', icon: '🥾', color: '#ff9d1c' },
  { id: 'port', label: '항·포구', icon: '⚓', color: '#2a8fe0' },
  { id: 'citrus', label: '감귤재배지', icon: '🍊', color: '#ff8a1f' },
  { id: 'wind', label: '풍력발전기', icon: '🌬️', color: '#9fb4c8' },
  { id: 'light', label: '등대', icon: '🗼', color: '#e84a5f' },
  { id: 'hare', label: '돌하르방', icon: '🗿', color: '#8a877f' },
  { id: 'viz', label: '방문객 막대(API)', icon: '📊', color: '#8b5cf6' },
];

// vizKey: 공공데이터(서귀포시 직영관광지 관람객수) 의 컬럼 이름
export const PLACES = [
  { id: 'hallasan', cat: 'oreum', name: '한라산 백록담', lat: 33.3617, lon: 126.5292, always: true, desc: '해발 1,947m, 대한민국에서 가장 높은 산이에요. 정상에는 화산 분화구 호수인 백록담이 있어요.' },
  { id: 'seongsan', cat: 'tour', name: '성산일출봉', lat: 33.4581, lon: 126.9425, always: true, desc: '바다 속에서 분출한 화산이 만든 분화구. 일출 명소이자 유네스코 세계자연유산이에요.' },
  { id: 'cheonjiyeon', cat: 'tour', name: '천지연폭포', lat: 33.2469, lon: 126.5545, vizKey: '천지연폭포', desc: '서귀포 시내에 있는 높이 22m의 폭포. 밤에도 조명이 켜져 있어요.' },
  { id: 'cheonjeyeon', cat: 'tour', name: '천제연폭포', lat: 33.2530, lon: 126.4136, vizKey: '천제연폭포', desc: '중문관광단지 안의 3단 폭포. 선임교와 에메랄드빛 못이 유명해요.' },
  { id: 'jeongbang', cat: 'tour', name: '정방폭포', lat: 33.2447, lon: 126.5718, vizKey: '정방폭포', desc: '폭포수가 바다로 곧장 떨어지는, 아시아에서 보기 드문 해안 폭포예요.' },
  { id: 'jusang', cat: 'tour', name: '중문대포 주상절리대', lat: 33.2376, lon: 126.4254, vizKey: '중문대포 주상절리대', desc: '용암이 식으면서 만들어진 육각 기둥 바위가 바닷가에 늘어서 있어요.' },
  { id: 'sanbang', cat: 'tour', name: '산방산 · 용머리해안', lat: 33.2316, lon: 126.3147, vizKey: '산방산_용머리', desc: '종 모양 산방산 아래 용이 바다로 들어가는 모습의 해안 절벽이에요.' },
  { id: 'citrusmuseum', cat: 'tour', name: '제주 감귤박물관', lat: 33.2876, lon: 126.6185, vizKey: '감귤박물관', desc: '제주 감귤의 역사와 문화를 배우는 박물관이에요. 감귤이의 고향!' },
  { id: 'hyeopjae', cat: 'tour', name: '협재해변', lat: 33.3940, lon: 126.2390, desc: '에메랄드빛 바다와 하얀 모래, 멀리 비양도가 보이는 서쪽 해변이에요.' },
  { id: 'manjang', cat: 'tour', name: '만장굴', lat: 33.5284, lon: 126.7714, desc: '세계에서 손꼽히는 큰 용암동굴. 천연기념물이에요.' },
  { id: 'seopji', cat: 'tour', name: '섭지코지', lat: 33.4240, lon: 126.9300, desc: '바다로 툭 튀어나온 붉은 화산 지형. 등대와 유채꽃밭이 어우러져요.' },
  { id: 'udo', cat: 'tour', name: '우도', lat: 33.5014, lon: 126.9510, desc: '소가 누운 모양이라 이름 붙은 섬. 땅콩과 해변이 유명해요.' },
  { id: 'gapa', cat: 'tour', name: '가파도', lat: 33.1700, lon: 126.2740, desc: '청보리밭으로 유명한 낮고 평평한 섬이에요.' },
  { id: 'mara', cat: 'tour', name: '마라도', lat: 33.1143, lon: 126.2698, desc: '대한민국 최남단 섬. 짜장면으로도 유명해요.' },

  { id: 'saebyeol', cat: 'oreum', name: '새별오름', lat: 33.3640, lon: 126.3570, desc: '들불축제가 열리는 서쪽의 대표 오름. 억새가 아름다워요.' },
  { id: 'yongnuni', cat: 'oreum', name: '용눈이오름', lat: 33.4590, lon: 126.8190, desc: '부드러운 능선이 매력적인 동쪽 오름이에요.' },
  { id: 'darangshi', cat: 'oreum', name: '다랑쉬오름', lat: 33.4800, lon: 126.8000, desc: '아름다운 원형 분화구를 가진 "오름의 여왕"이에요.' },
  { id: 'sangumburi', cat: 'oreum', name: '산굼부리', lat: 33.4390, lon: 126.6970, desc: '평지에 깊게 푹 꺼진 거대한 분화구예요.' },
  { id: 'geomun', cat: 'oreum', name: '거문오름', lat: 33.4300, lon: 126.6990, desc: '용암동굴계를 만든 화산. 세계자연유산이에요.' },

  { id: 'port-jeju', cat: 'port', name: '제주항', lat: 33.5200, lon: 126.5420, desc: '육지와 제주를 잇는 가장 큰 관문 항구예요.' },
  { id: 'port-aewol', cat: 'port', name: '애월항', lat: 33.4730, lon: 126.3290, desc: '카페 거리로 유명한 애월의 작은 항구예요.' },
  { id: 'port-hallim', cat: 'port', name: '한림항', lat: 33.4140, lon: 126.2650, desc: '비양도로 가는 배가 떠나는 서쪽 항구예요.' },
  { id: 'port-moseulpo', cat: 'port', name: '모슬포항', lat: 33.2150, lon: 126.2530, desc: '마라도·가파도행 배를 타는 남서쪽 항구예요.' },
  { id: 'port-seogwipo', cat: 'port', name: '서귀포항', lat: 33.2400, lon: 126.5650, desc: '새섬이 마주 보이는 남쪽 항구예요.' },
  { id: 'port-seongsan', cat: 'port', name: '성산포항', lat: 33.4730, lon: 126.9330, desc: '우도로 가는 배가 오가는 동쪽 항구예요.' },
  { id: 'port-gimnyeong', cat: 'port', name: '김녕항', lat: 33.5580, lon: 126.7620, desc: '맑은 바다와 풍력발전기 풍경이 어우러지는 북동쪽 포구예요.' },

  { id: 'light-dodu', cat: 'light', name: '도두 등대', lat: 33.5130, lon: 126.4690, desc: '제주공항 가까운 도두봉 아래 바닷가의 등대예요.' },
  { id: 'light-sanji', cat: 'light', name: '산지 등대', lat: 33.5240, lon: 126.5330, desc: '제주항 입구를 밝혀 주는 등대예요.' },
  { id: 'light-sumyeol', cat: 'light', name: '고산(수월봉) 등대', lat: 33.2960, lon: 126.1630, desc: '서쪽 끝 수월봉 부근 바다를 지키는 등대예요.' },
  { id: 'light-mara', cat: 'light', name: '마라도 등대', lat: 33.1135, lon: 126.2660, desc: '대한민국 최남단을 비추는 등대예요.' },
  { id: 'light-seongsan', cat: 'light', name: '성산 등대', lat: 33.4655, lon: 126.9395, desc: '일출봉 아래 동쪽 해안을 밝히는 등대예요.' },

  { id: 'wind-hangyeong', cat: 'wind', name: '한경 풍력단지', lat: 33.3315, lon: 126.1700, n: 5, desc: '서쪽 해안을 따라 서 있는 풍력발전기들이에요.' },
  { id: 'wind-haengwon', cat: 'wind', name: '행원 풍력단지', lat: 33.5545, lon: 126.8080, n: 5, desc: '동북쪽 바닷가의 풍력발전 단지예요.' },
  { id: 'wind-gimnyeong', cat: 'wind', name: '김녕 풍력단지', lat: 33.5610, lon: 126.7440, n: 5, desc: '맑은 바다 옆에서 돌아가는 풍력발전기들이에요.' },
  { id: 'wind-gasiri', cat: 'wind', name: '가시리 풍력단지', lat: 33.3640, lon: 126.7040, n: 4, desc: '넓은 초원 위의 풍력발전기들이에요.' },

  { id: 'citrus-namwon', cat: 'citrus', name: '남원 감귤밭', lat: 33.2800, lon: 126.7200, r: 4, desc: '남쪽 해안 가까운 따뜻한 감귤 주산지예요.' },
  { id: 'citrus-hyodon', cat: 'citrus', name: '효돈 감귤밭', lat: 33.2850, lon: 126.6100, r: 3.5, desc: '맛있는 감귤로 이름난 마을이에요.' },
  { id: 'citrus-jungmun', cat: 'citrus', name: '중문 감귤밭', lat: 33.2700, lon: 126.4300, r: 3.5, desc: '관광단지 뒤편으로 펼쳐진 감귤 과수원이에요.' },
  { id: 'citrus-aewol', cat: 'citrus', name: '애월·한림 감귤밭', lat: 33.4150, lon: 126.3250, r: 3.5, desc: '서쪽 중산간 지대의 감귤 과수원이에요.' },

  { id: 'hare-jeju', cat: 'hare', name: '돌하르방 (제주시 · 관덕정)', lat: 33.5131, lon: 126.5219, desc: '제주를 지키는 수호신 돌하르방. 제주시 옛 중심가에 있어요.' },
  { id: 'hare-seogwipo', cat: 'hare', name: '돌하르방 (서귀포)', lat: 33.2540, lon: 126.5600, desc: '서귀포 시내를 내려다보는 돌하르방이에요.' },
  { id: 'hare-seongsan', cat: 'hare', name: '돌하르방 (성산)', lat: 33.4650, lon: 126.9300, desc: '동쪽 끝 성산을 지키는 돌하르방이에요.' },
];

export const PRESETS = [
  { id: 'all', label: '제주 전체', target: [0, 0, 0], offset: [0, 78, 92] },
  { id: 'hallasan', label: '한라산', place: 'hallasan', offset: [20, 15, 24] },
  { id: 'seongsan', label: '성산·우도', place: 'seongsan', offset: [12, 10, 16] },
  { id: 'seogwipo', label: '서귀포 폭포', place: 'cheonjiyeon', offset: [16, 11, 18] },
  { id: 'wind', label: '서쪽 풍력', place: 'wind-hangyeong', offset: [9, 7, 11] },
];
