1. Install Requirements
2. Start node
```
fastapi dev CLI/Local-CLI/local-cli-backend/main.py   --host 0.0.0.0 --port 8000
```

3. Access Website through browser -- `http://45.33.11.32:8000/`

4. Refresh

```shell
Result: Stack Script
Traceback (most recent call last):
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/uvicorn/protocols/http/httptools_impl.py", line 409, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/uvicorn/middleware/proxy_headers.py", line 60, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/fastapi/applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/applications.py", line 112, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/middleware/errors.py", line 187, in __call__
    raise exc
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/middleware/errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/middleware/cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/middleware/exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/routing.py", line 714, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/routing.py", line 734, in app
    await route.handle(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/fastapi/routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/fastapi/routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/starlette/concurrency.py", line 37, in run_in_threadpool
    return await anyio.to_thread.run_sync(func)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/anyio/to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/anyio/_backends/_asyncio.py", line 2470, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/venv/lib/python3.12/site-packages/anyio/_backends/_asyncio.py", line 967, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "/root/cli-review/UCSCAnylogGithubProjects/CLI/Local-CLI/local-cli-backend/main.py", line 52, in get_status
    user = supabase_get_user()
           ^^^^^^^^^^^^^^^^^^^
TypeError: supabase_get_user() missing 1 required positional argument: 'jwt'
^C      INFO   Shutting down
      INFO   Waiting for application shutdown.
      INFO   Application shutdown complete.
      INFO   Finished server process [2133464]
      INFO   Stopping reloader process [2133462]
```