@musician
Feature: Create musician profile
  In order to participate in bands
  As an authenticated user
  I want to create my musician profile

  Background:
    Given An authenticated user "daniel" with password "asdASD123!"

  Scenario: A valid profile is created
    Given I send a POST request to "/v1/profile" with body:
    """
    {
      "id": "e44d5c41-9fb9-4df1-8df6-9ec614ddf496",
      "name": "Daniel Musician",
      "username": "danielmusician"
    }
    """
    Then the response status code should be 201
    And the response should be empty

  Scenario: A duplicated username returns a clean conflict
    Given another musician already exists with username "taken-username"
    When I send a POST request to "/v1/profile" with body:
    """
    {
      "id": "d6ded33a-50d7-4ca2-82b7-6c2e59368c8f",
      "name": "Another Daniel",
      "username": "taken-username"
    }
    """
    Then the response status code should be 409
    And the response should be:
      """
      {
        "code": "MUSICIAN_USERNAME_ALREADY_EXISTS",
        "message": "The username <taken-username> is already in use."
      }
      """

  Scenario: An authenticated user with an existing profile gets a clean conflict
    Given they have a musician profile
    When I send a POST request to "/v1/profile" with body:
    """
    {
      "id": "61f95dae-c68f-4b55-b996-f55342479a2e",
      "name": "Daniel Musician Again",
      "username": "danielmusician-again"
    }
    """
    Then the response status code should be 409
    And the response should be:
      """
      {
        "code": "MUSICIAN_USER_ALREADY_HAS_PROFILE",
        "message": "The user <4b71f8b1-9950-5d50-b526-57b922065673> already has a musician profile."
      }
      """
