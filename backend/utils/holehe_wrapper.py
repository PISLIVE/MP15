import sys
import json
import traceback

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No email provided"}))
        sys.exit(1)

    email = sys.argv[1]

    try:
        import trio
        import httpx
    except ImportError as e:
        print(json.dumps({"error": f"Missing dependency: {e}"}))
        sys.exit(1)

    # Try to discover holehe modules dynamically
    try:
        import pkgutil
        import importlib
        import holehe.modules

        website_functions = []
        for importer, modname, ispkg in pkgutil.walk_packages(
            holehe.modules.__path__, prefix="holehe.modules."
        ):
            if not ispkg:
                try:
                    mod = importlib.import_module(modname)
                    func_name = modname.split(".")[-1]
                    if hasattr(mod, func_name) and callable(getattr(mod, func_name)):
                        website_functions.append(getattr(mod, func_name))
                except Exception:
                    pass

        sys.stderr.write(f"[holehe] Discovered {len(website_functions)} modules\n")

    except Exception as e:
        sys.stderr.write(f"[holehe] Module discovery failed: {e}\n")
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({}))
        sys.exit(0)

    if not website_functions:
        sys.stderr.write("[holehe] No modules found\n")
        print(json.dumps({}))
        sys.exit(0)

    async def check_email():
        out = []
        client = httpx.AsyncClient(timeout=10.0)

        try:
            with trio.move_on_after(25):
                async with trio.open_nursery() as nursery:
                    for func in website_functions:
                        nursery.start_soon(func, email, client, out)
        except Exception as e:
            sys.stderr.write(f"[holehe] Scan error: {e}\n")
        finally:
            await client.aclose()

        results = {}
        for item in out:
            name = item.get("name", "")
            if name:
                results[name] = {
                    "exists": item.get("exists", False),
                    "rateLimit": item.get("rateLimit", False),
                    "emailrecovery": item.get("emailrecovery"),
                    "phoneNumber": item.get("phoneNumber"),
                }

        sys.stderr.write(f"[holehe] Checked {len(results)} sites, "
                         f"{sum(1 for v in results.values() if v['exists'])} registered\n")
        print(json.dumps(results))

    trio.run(check_email)

if __name__ == "__main__":
    main()
