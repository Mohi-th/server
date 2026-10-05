# Express JSON CRUD

Express server with full CRUD for `users`, stored in `data/db.json`.

## Run
    npm install
    npm start        # http://localhost:3000  (set PORT to change)

## Endpoints
| Method | Path         | Description                                   |
|--------|--------------|-----------------------------------------------|
| POST   | /users       | Create (name required; id auto-generated)     |
| GET    | /users       | List (?city=, ?onboarding_status=, ?search=)  |
| GET    | /users/:id   | Get one                                       |
| PUT    | /users/:id   | Replace editable fields                       |
| PATCH  | /users/:id   | Update some fields                            |
| DELETE | /users/:id   | Delete                                        |

## Example
    curl -X POST localhost:3000/users -H "Content-Type: application/json" \
      -d '{"name":"Divya Menon","city":"Mysuru","phone":"+91 87890 12345"}'
