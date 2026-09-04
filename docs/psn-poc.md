# PSN Trophy API PoC

Этот изолированный серверный proof of concept проверяет read-only получение trophy-данных основного PSN-профиля через отдельный служебный аккаунт владельца. Служебный аккаунт предоставляет только authentication context, а target-профиль задаётся через `PSN_TARGET_ONLINE_ID`. PoC автоматически разрешает точное совпадение onlineId в accountId через Universal Search и нигде не сохраняет найденный accountId.

PoC не создаёт UI, не пишет в базу данных и не изменяет данные PSN. Используемый API неофициальный и может измениться без предупреждения.

## Аккаунты и безопасность

`PSN_NPSSO` должен принадлежать отдельному служебному PSN-аккаунту владельца. Не используйте купленный, арендованный или чужой аккаунт. NPSSO основного аккаунта не нужен.

NPSSO фактически даёт доступ к аккаунту, поэтому с ним нужно обращаться как с паролем: не передавать в чатах и аргументах командной строки, не сохранять в файлах репозитория и не выводить в логи. NPSSO ориентировочно приходится вручную обновлять примерно раз в два месяца, но гарантированного срока действия нет.

Локально задайте обе обязательные переменные только в environment текущего процесса:

```powershell
$env:PSN_NPSSO = "<service-account NPSSO>"
$env:PSN_TARGET_ONLINE_ID = "<target onlineId>"
npm run psn:poc
```

В GitHub откройте **Settings → Secrets and variables → Actions** и создайте:

- repository secret `PSN_NPSSO` со значением служебного аккаунта;
- repository variable `PSN_TARGET_ONLINE_ID` с onlineId основного профиля.

Workflow `.github/workflows/psn-poc.yml` запускается только вручную через **Actions → PSN Trophy PoC → Run workflow**.

## Preconditions первого live run

До первого acceptance-запуска пользователь вручную проверяет на основном аккаунте:

- `Who can see your gaming history` / «Кто может видеть историю игр» установлено в `Anyone` / «Все»;
- Resident Evil 4 не скрыта от других игроков;
- trophies Resident Evil 4 синхронизированы с PlayStation Network;
- основной и служебный аккаунты не заблокировали друг друга;
- основной и служебный аккаунты не находятся в друзьях.

Первый успешный запуск в таком состоянии проверяет, что дружба не требуется при видимости `Anyone/Все`. PoC не добавляет аккаунты в друзья и не использует программный fallback.

## Запуск и результат

Unit tests не используют сеть и не требуют реальных identifiers или секретов:

```powershell
npm run psn:poc:test
```

Для явного выбора trophy set Resident Evil 4 дополнительно задайте:

```powershell
$env:PSN_POC_NP_COMMUNICATION_ID = "<npCommunicationId>"
npm run psn:poc
```

Без явного ID PoC проверяет trophy sets с точным названием `Resident Evil 4` и выбирает тот, где присутствует группа `Separate Ways`.

Нормализованный отчёт появляется только после полной успешной проверки в `.tmp/psn-poc/report.json`. Путь игнорируется Git. Отчёт содержит приватные игровые данные, поэтому его нельзя коммитить, публиковать или загружать как публичный workflow artifact.
