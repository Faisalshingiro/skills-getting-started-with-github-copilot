from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client():
    with TestClient(app_module.app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_activities():
    original_activities = deepcopy(app_module.activities)
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original_activities))
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original_activities))


def test_signup_updates_activity_participants(client):
    # Arrange
    activity_name = "Chess Club"
    new_email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={new_email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {new_email} for {activity_name}"

    activities = client.get("/activities").json()
    assert new_email in activities[activity_name]["participants"]


def test_unregister_participant_removes_them_from_activity(client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{participant_email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {participant_email} from {activity_name}"

    activities = client.get("/activities").json()
    assert participant_email not in activities[activity_name]["participants"]
