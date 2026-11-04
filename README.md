# 사진 아카이브 홈페이지

광고 없는 무료 사진 포트폴리오 사이트예요. 홈페이지 주소 뒤에 `/admin`을 붙여 들어가면 브라우저에서 바로 사진을 올리거나 지울 수 있어요.

- **호스팅:** Netlify 무료 요금제
- **사진·글 저장:** GitHub 저장소 (무료)
- **관리자 페이지:** Decap CMS (`/admin`)
- **연락 양식:** Netlify Forms (무료 요금제는 한 달에 100건까지)

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

## 처음 한 번만: 인터넷에 올리기 (약 20분)

### 1. GitHub에 파일 올리기
1. https://github.com 에 가입해요.
2. 오른쪽 위 **+ → New repository**를 눌러요. 이름은 `photo-archive`로 하고, 공개 범위는 **Public**으로 둔 채 만들어요.
3. **uploading an existing file**을 눌러 이 폴더 안의 모든 파일과 폴더를 끌어다 놓고 **Commit changes**를 눌러요.
   - `.claude` 폴더는 올리지 않아도 돼요.
4. 올리기 전에 `admin/config.yml` 파일의 `repo:` 줄을 본인 아이디로 바꿔요.
   예: `repo: kangbyeongwan/photo-archive`

### 2. Netlify로 배포하기
1. https://app.netlify.com 에서 **GitHub 계정으로 가입**해요.
2. **Add new project → Import an existing project → GitHub**를 누르고 `photo-archive`를 골라요.
3. 설정은 그대로 두고 **Deploy**를 눌러요. 1분쯤 지나면 `https://jolly-otter-12ab34.netlify.app` 같은 임시 주소가 생겨요.
4. **Project configuration → General → Change project name**에서 이름을 `kangbyeongwan`으로 바꾸면 주소가 `https://kangbyeongwan.netlify.app`이 돼요. 이미 누가 쓰고 있으면 `kangbyeongwan-photo`처럼 바꿔 보세요.

### 3. 관리자 로그인 연결하기 (GitHub OAuth)
1. GitHub에서 **Settings → Developer settings → OAuth Apps → New OAuth App**을 눌러요.
   - Application name: 아무 이름 (예: Photo Admin)
   - Homepage URL: 내 사이트 주소 (예: `https://kangbyeongwan.netlify.app`)
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. 만든 뒤 **Client ID**를 복사하고, **Generate a new client secret**으로 비밀 키를 만들어 복사해요.
3. Netlify에서 **Project configuration → Access & security → OAuth → Install provider**를 누르고 **GitHub**를 고른 뒤 두 값을 붙여 넣어요.

### 4. 연락 양식 켜기
1. Netlify에서 **Project configuration → Forms**로 가서 **Enable form detection**을 눌러요.
2. **Deploys → Trigger deploy → Deploy project**로 한 번 더 배포해요.
3. **Forms → Form notifications**에서 새 메시지가 왔을 때 받을 이메일 주소를 등록해요.

---

## 평소에 쓰는 법: 사진 올리기와 지우기

1. `https://내사이트주소/admin` 에 들어가서 **GitHub로 로그인**을 눌러요.
2. **시리즈 → 새 시리즈**를 눌러 제목, 장소, 날짜를 적고, **사진** 칸에서 **추가**를 눌러 사진을 올려요.
3. **저장(Publish)**을 누르면 1분쯤 뒤에 사이트에 반영돼요.

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
- **나만의 도메인** (예: `kangbyeongwan.com`): 도메인만 1년에 1~2만 원 정도로 사서 Netlify **Domain management**에 연결하면 돼요.
- **샵 페이지:** 판매할 게 생기면 페이지를 하나 추가하면 돼요.

## 내 컴퓨터에서 미리 보기
```bash
node build.js && python3 -m http.server 8765
```
그다음 브라우저에서 http://localhost:8765 를 열어요. 연락 양식 전송과 관리자 로그인은 Netlify에 올린 뒤에만 동작해요.
