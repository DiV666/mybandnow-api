@profile
Feature: Get current user profile guard

  Scenario: An authenticated user receives their profile
    Given An authenticated user "testuser" with password "asdASD123!"
    And they have a musician profile
    When I send a GET request to "/v1/profile"
    Then the response status code should be 200
    And the response with ignored fields "id" should be:
      """
      {
        "userId": "fd92cb7a-3539-5270-bed8-a3f23ffee082",
        "name": "testuser",
        "username": "testuser"
      }
      """

  Scenario: An authenticated user without profile gets not found
    Given I send a POST request to "/v1/users/register" with body:
      """
      {
        "id": "c1c2d3e4-f5a6-4789-9012-abcdef123456",
        "email": "ghostfree@example.com",
        "password": "mypassword"
      }
      """
    And I authenticate as user "ghostfree" with id "c1c2d3e4-f5a6-4789-9012-abcdef123456"
    When I send a GET request to "/v1/profile"
    Then the response status code should be 404
    And the response should be:
      """
      {
        "message": "Profile not found"
      }
      """

  Scenario: A token for a non-existent user is rejected
    Given I authenticate as user "ghost" with id "d4d96f37-4cc8-4b7f-bc59-95f4d8d8b9bb"
    When I send a GET request to "/v1/profile"
    Then the response status code should be 401
    And the response should be:
      """
      {
        "code": "UNAUTHORIZED",
        "message": "Unauthorized"
      }
      """

  Scenario: An unauthenticated request is rejected
    When I send a GET request to "/v1/profile"
    Then the response status code should be 401
    And the response should be:
      """
      {
        "code": "UNAUTHORIZED",
        "message": "No credentials provided."
      }
      """

  Scenario: A request with an invalid bearer token is rejected
    Given An user with apikey "invalid-token"
    When I send a GET request to "/v1/profile"
    Then the response status code should be 401
    And the response should be:
      """
      {
        "code": "UNAUTHORIZED",
        "message": "Unauthorized"
      }
      """
