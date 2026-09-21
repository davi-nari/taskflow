# TaskFlow + Supabase

TaskFlow v1.5.0 использует Supabase как основное постоянное хранилище и Supabase Auth для входа владельца.

## Если схема ещё не создавалась

1. Откройте Supabase -> SQL Editor.
2. Выполните целиком `schema.sql`.
3. В Authentication -> Users создайте владельца TaskFlow.

## Если вы уже запускали schema.sql из v1.4.0

Выполните только `migration_v1.5.sql`. Он добавляет поля настроек, `work_session_id` и обновляет публичный manager RPC.

## Что хранится

- `taskflow_tasks` - задачи и планы.
- `taskflow_actions` - действия и ссылки-доказательства.
- `taskflow_work_sessions` - фактические рабочие интервалы.
- `taskflow_breaks` - перерывы.
- `taskflow_settings` - график, категории, локационные overrides, daily minimum и timezone.
- `taskflow_manager_links` - только SHA-256 hashes публичных токенов.

RLS ограничивает приватные таблицы владельцем `auth.uid()`. Публичный RPC `taskflow_manager_snapshot` намеренно не возвращает рабочее время, сессии, паузы и плановые минуты.

## Миграция localStorage

После первого успешного входа приложение проверяет базу пользователя. Если в Supabase ещё нет задач, а в текущем браузере остались задачи старой версии, они автоматически загружаются в Supabase вместе с actions, work sessions, breaks и settings.
