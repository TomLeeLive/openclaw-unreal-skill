# OpenClaw Unreal Skill

OpenClaw AI 어시스턴트를 통해 Unreal Editor를 제어합니다.

## 개요

이 스킬은 OpenClaw Unreal Plugin을 통해 AI 지원 Unreal Engine 개발을 가능하게 합니다.

## 사전 요구 사항

1. Unreal Engine 5.x 프로젝트
2. 프로젝트에 OpenClaw Unreal Plugin 설치
3. OpenClaw Gateway 실행 중

## 설치

### 플러그인 설치

1. `openclaw-unreal-plugin` 폴더를 프로젝트의 `Plugins` 디렉토리에 복사
2. Unreal Editor 재시작
3. Edit → Plugins → OpenClaw에서 플러그인 활성화

### 스킬 설치

```bash
# 스킬을 OpenClaw workspace에 복사
cp -r openclaw-unreal-skill ~/.openclaw/workspace/skills/unreal-plugin
```

## 사용 가능한 도구

### Level 관리
- `level.getCurrent` - 현재 레벨 정보 가져오기
- `level.list` - 모든 레벨 나열
- `level.open` - 경로로 레벨 열기
- `level.save` - 현재 레벨 저장

### Actor 조작
- `actor.find` - 이름으로 Actor 찾기
- `actor.getAll` - 모든 Actor 가져오기
- `actor.create` - 새 Actor 스폰
- `actor.delete` - Actor 제거
- `actor.getData` - Actor 상세 정보 가져오기

### Transform
- `transform.getPosition` / `setPosition`
- `transform.getRotation` / `setRotation`
- `transform.getScale` / `setScale`

### Editor 제어
- `editor.play` - PIE 시작
- `editor.stop` - PIE 중지
- `editor.pause` / `resume`
- `editor.getState`

### Debug
- `debug.hierarchy` - World Outliner 트리
- `debug.screenshot` - 뷰포트 캡처
- `debug.log` - Output에 메시지 로그

### Input 시뮬레이션
- `input.simulateKey` - 키보드 입력
- `input.simulateMouse` - 마우스 입력
- `input.simulateAxis` - 게임패드/축 입력

### 에셋
- `asset.list` - 콘텐츠 탐색
- `blueprint.list` / `open`

## 사용 예제

```
사용자: 위치 (100, 200, 50)에 큐브 만들어
AI: [actor.create type="Cube" x=100 y=200 z=50 사용]

사용자: 플레이어 스타트를 센터로 옮겨
AI: [actor.find name="PlayerStart" 후 transform.setPosition x=0 y=0 z=0 사용]

사용자: 게임 시작해
AI: [editor.play 사용]
```

## 설정

프로젝트 루트에 `openclaw.json` 생성:

```json
{
  "host": "127.0.0.1",
  "port": 27742,
  "autoConnect": true
}
```

## 문제 해결

### 플러그인 연결 안됨
- `[OpenClaw]` 메시지에 대해 Output Log 확인
- Gateway 실행 확인: `openclaw gateway status`
- 포트 27742 사용 가능 확인

### 도구 작동 안함
- 플러그인 활성화 확인
- Actor 수정 시 PIE 상태가 아닌지 확인
- Actor 이름이 정확히 일치하는지 확인

## 라이선스

MIT 라이선스 - LICENSE 파일 참조
