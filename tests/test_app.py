from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_signup_updates_activity_participants():
    new_email = "newstudent@mergington.edu"
    response = client.post("/activities/Chess Club/signup?email=" + new_email)

    assert response.status_code == 200
    activities = client.get("/activities").json()
    assert new_email in activities["Chess Club"]["participants"]

    client.delete("/activities/Chess Club/participants/" + new_email)


def test_unregister_participant_removes_them_from_activity():
    response = client.delete(
        "/activities/Chess Club/participants/michael@mergington.edu"
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Unregistered michael@mergington.edu from Chess Club"

    activities = client.get("/activities").json()
    assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]

    response = client.delete(
        "/activities/Chess Club/participants/michael@mergington.edu"
    )
    assert response.status_code == 404
