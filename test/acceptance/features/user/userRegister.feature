Feature: register User
  In order to register __ModuleLowerCase__
  As an __AuthRole__
  I want to be able to execute the custom register action

  Scenario: Successfully register a new user
    Given I send a POST request to "/v1/users/register" with body:
    """
    {
      "id": "713bd8a2-c119-4828-bfae-21ea2f57a942",
      "email": "newuser@example.com",
      "password": "mypassword"
    }
    """
    Then the response status code should be 201
    And the response should be empty

  Scenario: Registering a user does not auto-create the musician profile
    Given I send a POST request to "/v1/users/register" with body:
    """
    {
      "id": "c1c2d3e4-f5a6-4789-9012-abcdef123456",
      "email": "ghostfree@example.com",
      "password": "mypassword"
    }
    """
    Then the response status code should be 201
    And the response should be empty
    Given I authenticate as user "ghostfree" with id "c1c2d3e4-f5a6-4789-9012-abcdef123456"
    When I send a GET request to "/v1/profile"
    Then the response status code should be 404
    And the response should be:
      """
      {
        "message": "Profile not found"
      }
      """
