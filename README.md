# 사진 아카이브 홈페이지

광고 없는 무료 사진 포트폴리오 사이트예요. 홈페이지 주소 뒤에 `/admin`을 붙여 들어가면 브라우저에서 바로 사진을 올리거나 지울 수 있어요.

- **호스팅:** Cloudflare Pages 무료 요금제 (방문자 트래픽 무제한, 한 달 배포 500번, 한도를 넘어도 사이트는 멈추지 않아요)
- **사진·글 저장:** GitHub 저장소 (무료)
- **관리자 페이지:** Decap CMS (`/admin`), GitHub 로그인은 `functions/api/` 가 처리해요
- **연락 양식:** Web3Forms (무료, 한 달 250건). 키가 없으면 보내기 버튼이 메일 앱을 열어요
- **사진 크기:** 배포할 때 `build.js` 가 사진을 여러 크기로 미리 줄여서 `dist` 폴더에 넣어요. 원본은 GitHub에 그대로 있어요

## 페이지 구성

| 페이지 | 내용 |
|---|---|
| 홈 (`/`) | 전체 화면 사진 슬라이드와 시리즈 목록 |
| 시리즈 (`/series.html`) | 시리즈 목록. 시리즈를 누르면 사진이 크게 하나씩 이어져 나와요 |
| 아카이브 (`/archive.html`) | 모든 사진을 모아 보는 그리드. 시리즈별로 걸러 볼 수 있어요 |
| 소개 (`/about.html`) | 프로필 사진과 소개 글 |
| 연락 (`/contact.html`) | 연락 양식, 이메일, 인스타그램 |

사진을 누르면 크게 보는 화면이 열려요. 키보드 화살표나 스와이프로 넘길 수 있어요. 오른쪽 위 KO / EN 버튼으로 언어를 바꿀 수 있어요.

---

## 처음 한 번만: Cloudflare Pages에 올리기

### 1. Cloudflare Pages 프로젝트 만들기
1. https://dash.cloudflare.com 에 가입하고 로그인해요.
2. **Workers & Pages → Create → Pages → Connect to Git**을 누르고 GitHub를 연결해 `photo-archive` 저장소를 골라요.
3. 빌드 설정:
   - Project name: `kangbyeongwan` (주소가 `kangbyeongwan.pages.dev` 가 돼요)
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Save and Deploy**를 눌러요.

### 2. 관리자 로그인 연결하기 (GitHub OAuth)
1. GitHub **Settings → Developer settings → OAuth Apps**에서 OAuth 앱을 열어요 (없으면 New OAuth App).
   - Homepage URL: `https://kangbyeongwan.pages.dev`
   - Authorization callback URL: `https://kangbyeongwan.pages.dev/api/callback`
2. Cloudflare 프로젝트 **Settings → Variables and Secrets**에 두 값을 넣어요.
   - `GITHUB_CLIENT_ID`: Client ID (Type: Text)
   - `GITHUB_CLIENT_SECRET`: Client secret (Type: **Secret**)
3. **Deployments**에서 가장 최근 배포의 **⋯ → Retry deployment**를 눌러 다시 배포해요.

### 3. 연락 양식 켜기
1. https://web3forms.com 에서 받을 이메일 주소를 넣고 Access Key를 받아요.
2. 관리자 **사이트 설정 → 연락 양식 키**에 붙여 넣고 저장해요.

---

## 평소에 쓰는 법: 사진 올리기와 지우기

1. `https://내사이트주소/admin` 에 들어가서 **GitHub로 로그인**을 눌러요.
2. **시리즈 → 새 시리즈**를 눌러 제목, 장소, 날짜를 적고, **사진** 칸에서 **추가**를 눌러 사진을 올려요.
3. **저장(Publish)**을 누르면 1~2분 뒤에 사이트에 반영돼요. 저장할 때마다 배포가 한 번 일어나니, 사진을 여러 장 올릴 때는 다 올린 뒤 한 번만 저장하는 게 좋아요.

- **사진 지우기:** 시리즈를 열고 사진 항목 옆의 휴지통을 누른 뒤 저장해요.
- **시리즈 지우기:** 시리즈를 열고 오른쪽 위 메뉴에서 **삭제**를 눌러요.
- **잠깐 숨기기:** 지우지 않고 **숨기기**를 체크하면 사이트에서만 안 보여요.
- **사진 파일까지 완전히 지우기:** 시리즈에서 빼도 파일은 남아 있어요. 위쪽 **미디어(Media)** 메뉴에서 파일을 골라 지울 수 있어요.
- **이름, 소개 글, 이메일, 첫 화면 슬라이드:** **사이트 설정**에서 바꿔요.

> 처음 들어 있는 샘플 시리즈 3개(산의 빛, 도시의 시간, 바다 곁에서)는 지우고 내 사진으로 채우면 돼요.

### 사진 크기 팁
GitHub 저장소는 전체 1GB 안쪽으로 쓰는 게 좋아요. 업로드하기 전에 **긴 변 2400px, JPEG 품질 80~85%** 정도로 내보내면 한 장이 0.5~1MB 정도라 1,000장 넘게 올릴 수 있어요. 라이트룸에서는 내보내기할 때 "크기 조정: 긴 가장자리 2400픽셀"을 쓰면 돼요.

---

## 나중에 할 수 있는 것
- **나만의 도메인** (예: `kangbyeongwan.com`): 도메인만 1년에 1~2만 원 정도로 사서 Cloudflare Pages 프로젝트의 **Custom domains**에 연결하면 돼요.
- **샵 페이지:** 판매할 게 생기면 페이지를 하나 추가하면 돼요.

## 내 컴퓨터에서 미리 보기
```bash
npm install && npm run build && cd dist && python3 -m http.server 8765
```
그다음 브라우저에서 http://localhost:8765 를 열어요. 관리자 로그인은 Cloudflare에 올린 뒤에만 동작해요.
