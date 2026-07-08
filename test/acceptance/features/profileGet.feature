@profile
Feature: Get current user profile

  Background:
    Given An authenticated user "testuser" with password "asdASD123!"

  Scenario: A valid profile is returned for the authenticated user
    Given I send a GET request to "/v1/profile"
    Then the response status code should be 200
    And the response with ignored fields "id" should be:
      """
      {
        "userId": "fd92cb7a-3539-5270-bed8-a3f23ffee082",
        "name": "testuser",
        "username": "testuser"
      }
      """
