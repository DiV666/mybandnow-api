@musician
Feature: Guard write actions until the musician profile exists
  In order to browse before profile completion
  As an authenticated user without a musician profile
  I should only be allowed through the routes that explicitly require a profile once it exists

  Background:
    Given An authenticated user "guardeduser" with password "asdASD123!"

  Scenario: The profile creation route stays unguarded before the musician profile exists
    When I send a POST request to "/v1/profile" with body:
    """
    {
      "id": "f86f0b62-2f8f-49d3-8518-42199d9db646",
      "name": "Guarded User",
      "username": "guardeduser"
    }
    """
    Then the response status code should be 201
    And the response should be empty

  Scenario: An explicitly guarded write route is rejected when the musician profile does not exist
    When I send a POST request to "/v1/bands" with body:
    """
    {
      "id": "86a34431-a0a6-418e-a74e-7200d10279b4",
      "name": "No Profile Band"
    }
    """
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Profile required"
      }
      """

  Scenario: An explicitly guarded write route is allowed once the musician profile exists
    Given they have a musician profile
    When I send a POST request to "/v1/bands" with body:
    """
    {
      "id": "5d1d56f6-0bb9-4cd2-bbc7-c04e947667e0",
      "name": "Profile Ready Band"
    }
    """
    Then the response status code should be 201
    And the response should be empty
